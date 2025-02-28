const { Restaurant, Table, Reservation } = require("../models");
const { confirmTime } = require("../utilities/confirmTime");
const { generateReservationCode } = require("../utilities/generateReservationCode");
const { v4: uuidv4 } = require("uuid");
const { constants } = require("../constants");
const { optimizeReservation } = require("../utilities/optimizeReservation");
const { isWithinBusinessHours } = require("../utilities/isWithinBusinessHours");
const { setStatus } = require("../utilities/setStatus");
const { stripePayment } = require("../services/stripePayment");
const { setReservationAlert } = require("../utilities/setReservationAlert");


const createReservation = async (req, res) => {
    try {
        const { tableId, restaurantId, partySize, reservationTime, reservationTimeRange } = req.body;

        // check if User has reservations still pending
        const userHasAPendingReservation = await Reservation.findOne({
            where: {
                userId: req.userId,
                status: "pending",
            }
        });
        if (userHasAPendingReservation) {
            return res.status(400).json({ message: 'You currently have a table reservation with status "Pending". Please Confirm or Cancel reservation first before you can make further reservations' });
        };

        // Validate time variables
        // - ensure all time variables are not empty
        if (!tableId || !restaurantId || !partySize || !reservationTime || !reservationTimeRange) {
            return res.status(400).json({ message: "tableId, restaurantId, partySize, reservationTime, and reservationTimeRange are required." });
        };

        // Validate reservationTimeRange
        const validTimeRanges = new Set([120, 150, 180, 210, 240]);
        if (!validTimeRanges.has(reservationTimeRange)) {
            return res.status(400).json({ message: "Invalid reservation time range." });
        };

        let [datePart, timePart] = reservationTime.split("T");
        let [year, month, day] = datePart.split("-").map(Number);
        let [hours, minutes, seconds] = timePart.split(":").map(Number);
        // Create a new Date object in local time
        let reservationStartTime = new Date(year, month - 1, day, hours, minutes, seconds);
        let reservationEndTime = new Date(reservationTime);
        reservationEndTime = reservationEndTime.setMinutes(reservationStartTime.getMinutes() + reservationTimeRange);
        reservationEndTime = new Date(reservationEndTime);
        let reservationDate = new Date(reservationStartTime);
        reservationDate = reservationDate.toLocaleDateString('en-CA');

        // Check if partySize is more than table capacity
        const table = await Table.findOne({
            where: {
                id: tableId
            }
        });
        if (table.dataValues.capacity < partySize) { return res.status(400).json({ message: "The party size is more than the tables capacity. Please reduce the size or select a table with a larger capacity" }) };

        // Check if selected time is between opening and closing hours
        const restaurant = await Restaurant.findOne({
            where: {
                id: restaurantId
            }
        });
        const openingHours = restaurant.dataValues.openingHours
        const within = isWithinBusinessHours(reservationTime, openingHours, reservationTimeRange);
        if (!within) {
            return res.status(400).json({ message: `Selected time is not within the opening hours ${openingHours}` });
        };

        // Ensure selected date is not more than 91 days (3 months) ahead
        const currentTime = new Date(); // current date
        // calculate the maximum allowed date (91 days from today)
        let maxAllowedDate = new Date(currentTime);
        maxAllowedDate.setDate(maxAllowedDate.getDate() + 91);
        maxAllowedDate = maxAllowedDate.toLocaleDateString('en-CA');
        // Ensure selected date is at least 30 minutes ahead of now
        let minAllowedTime = new Date(currentTime.getTime() + 30 * 60 * 1000);  // Add 30 minutes to the current time
        // Check if the selected time is at least 1 hour 30 minutes ahead
        if (reservationStartTime < minAllowedTime) { return res.status(400).json({ message: "Selected time is too early or in the past" }); };
        // Ensure the user is booking within the allowed date range
        if (reservationDate > maxAllowedDate) { return res.status(400).json({ message: "Selected Date is not yet available for booking. Maximum allowed limit is 91 days (3 months)." }) };

        // Add buffer to End time. Buffer is necessary to enable time for prep for the next reservation
        const bufferEndTime = new Date(reservationEndTime);
        bufferEndTime.setMinutes(bufferEndTime.getMinutes() + constants.buffer);

        // Confirm if selected time range is available
        const isAvailable = await confirmTime(reservationDate, reservationStartTime, bufferEndTime, tableId);
        if (!isAvailable.value) {
            return res.status(400).json({ message: isAvailable.message });
        };

        // Lock table
        // check if someone is currently trying to make a reservation for this table
        const existingPendingReservation = await Reservation.findOne({
            where: {
                tableId: tableId,
                status: "pending",
            }
        });
        if (existingPendingReservation) {
            return res.status(400).json({ message: `A user is currently making arrangements for this table. Please try again after ${constants.pendingReservationGrace} minutes to see what spaces are available.` });
        };

        // Create a pending reservation
        const reservationId = uuidv4();
        const reservationCode = generateReservationCode();

        const pendingReservation = await Reservation.create({
            id: reservationId,
            userId: req.userId,
            restaurantId: restaurantId,
            tableId: tableId,
            tableScheduleKey: reservationDate,
            partySize: partySize,
            status: "pending",
            reservationCode: reservationCode
        });
        const reservation = await Reservation.findOne({
            where: {
                id: reservationId
            }
        });

        // Optimize schedule to reduce time wastage
        let reservationSchedule = {
            userId: req.userId,
            startTime: reservationStartTime,
            endTime: reservationEndTime,
            reservationId: reservationId,
            status: "pending"
        };

        let optimizedReservation = await optimizeReservation(reservationDate, reservationSchedule, tableId);
        // Add pending reservation grace time to the notifyAt time
        let notifyAt = new Date(reservation.createdAt);
        notifyAt.setMinutes(notifyAt.getMinutes() + constants.pendingReservationGrace);
        await setReservationAlert(notifyAt, reservationId, "pending")
        if (!optimizedReservation.optimized) {
            const paymentURL = await stripePayment(req.userId, reservationId);
            return res.status(200).json(paymentURL);
        };
        return res.status(200).json({ message: optimizedReservation.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to create a reservation" });
    };
};


const getAllReservations = async (req, res) => {
    try {
        const { restaurantId, tableId } = req.body;

        let where = {};

        if (restaurantId) where.restaurantId = restaurantId;
        if (tableId) where.tableId = tableId;
        where.userId = req.userId;

        const pendingReservations = await Reservation.findAll({
            where,
        });

        return res.status(200).json({ data: pendingReservations });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to get all users pending reservation" });
    };
};


const reservationStatusController = async (req, res) => {
    try {
        const { reservationId, status } = req.body;

        const reservation = await Reservation.findOne({
            where: {
                id: reservationId
            }
        });

        // Check if the User is trying to change to the same status
        if (reservation.dataValues.status === status) { return { message: `This reservation has already been ${status} and status can not be altered` } };

        if (status === "confirmed") {
            const paymentURL = await stripePayment(req.userId, reservationId);
            return res.status(200).json(paymentURL);
        };

        const response = setStatus(status, reservationId);
        if (response.message) {
            return res.status(400).json({ message: response.message });
        };

        return res.status(200).json({ message: "Reservation updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to change reservation status" });
    };
};


const deleteReservationTemporary = async (req, res) => {
    try {
        const { reservationId } = req.body;

        const reservation = await Reservation.destroy({
            where: {
                id: reservationId
            }
        });

        // Check if the Table exists and was deleted from Restaurant branch
        if (reservation) {
            return res.status(200).json({ message: 'Reservation deleted successfully' });
        } else {
            return res.status(404).json({ message: 'Reservation not found' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to delete reservation" });
    };
};


module.exports = { createReservation, getAllReservations, reservationStatusController, deleteReservationTemporary };
