const { Restaurant, Table, Reservation, TableSchedule } = require("../models");
const { confirmTime } = require("../utilities/confirmTime");
const { generateReservationCode } = require("../utilities/generateReservationCode");
const { v4: uuidv4 } = require("uuid");
const { constants } = require("../constants");
const { optimizeReservation } = require("../utilities/optimizeReservation");
const { isWithinBusinessHours } = require("../utilities/isWithinBusinessHours");


const createReservation = async (req, res) => {
    try {
        const { tableId, restaurantId, partySize, reservationTime, reservationTimeRange } = req.body;

        // Validate time variables
        // - ensure all time variables are not empty
        if (!tableId || !restaurantId || !partySize || !reservationTime || !reservationTimeRange) {
            return res.status(400).json({ message: "tableId, restaurantId, partySize, reservationTime, and reservationTimeRange are required." });
        };

        // Validate reservationTimeRange
        const validTimeRanges = new Set([120, 150, 180, 210]);
        if (!validTimeRanges.has(reservationTimeRange)) {
            return res.status(400).json({ message: "Invalid reservation time range." });
        };

        let [datePart, timePart] = reservationTime.split("T");
        let [year, month, day] = datePart.split("-").map(Number);
        let [hours, minutes, seconds] = timePart.split(":").map(Number);
        // Create a new Date object in local time
        let reservationStartTime = new Date(year, month - 1, day, hours, minutes, seconds);
        console.log(reservationStartTime);
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
        console.log("maxAllowedDate: ", maxAllowedDate);
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
        // check if someone is currently trying to make a reservation for a table
        const existingPendingReservation = await Reservation.findOne({
            where: {
                tableId: tableId,
                status: "pending",
            }
        });
        if (existingPendingReservation) {
            return res.status(400).json({ message: "A user is currently making arrangements for this table. Please try again after 10 minutes to see what spaces are available." });
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

        // Optimize schedule to reduce time wastage
        let reservationSchedule = {
            userId: req.userId,
            startTime: reservationStartTime,
            endTime: reservationEndTime,
            reservationId: reservationId,
            status: "pending"
        };

        let optimizedReservation = await optimizeReservation(reservationDate, reservationSchedule, tableId);
        if (!optimizeReservation.isOptimized) {
            const [updatedReservationStatus] = await Reservation.update({ status: "confirmed" }, {
                where: {
                    id: reservationId
                }
            });
        };
        return res.status(200).json({ message: optimizedReservation.message });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to create a reservation" });
    };
};


const getAllPendingReservations = async (req, res) => {
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

        // - ensure all time variables are not empty
        if (!reservationId || !status) {
            return res.status(400).json({ message: "reservationId and status are required." });
        };

        // Get Reservation
        const reservation = await Reservation.findOne({
            where: {
                id: reservationId,
            }
        });
        let tableId = reservation.dataValues.tableId;
        let restaurantId = reservation.dataValues.restaurantId;
        // Get table schedule
        const tableSchedule = await TableSchedule.findOne({
            where: {
                tableId: reservation.tableId,
                key: reservation.tableScheduleKey
            }
        });

        // Check if reservation has already been canceled
        // if (reservation.dataValues.status === "canceled") { return res.status(400).json({ message: "This reservation has already been canceled and status can not be altered" }) };

        // Check if user is passing the appropriate response
        if (status !== "confirmed" && status !== "canceled") {
            return res.status(400).json({ message: "Invalid response status from user" });
        };

        const [updatedReservationStatus] = await Reservation.update({ status: status }, {
            where: {
                restaurantId: restaurantId,
                tableId: tableId,
                userId: req.userId
            }
        });

        const updatedReservation = await Reservation.findOne({
            where: {
                restaurantId: restaurantId,
                tableId: tableId,
                userId: req.userId
            }
        });

        if (status === "canceled") {  // remove reservation from the appropriate tables table schedule
            console.log('1');
            const tableSchedule = await TableSchedule.findOne({
                where: {
                    key: reservation.dataValues.tableScheduleKey,
                    tableId: tableId
                }
            });
            console.log('2');

            let tableScheduleValues = tableSchedule.value;
            const startTime = tableScheduleValues.find(schedule => schedule.reservationId != tableScheduleValues.reservationId).startTime;
            const endTime = tableScheduleValues.find(schedule => schedule.reservationId != tableScheduleValues.reservationId).endTime;
            const newKey = tableSchedule.dataValues.key + " " + startTime + " - " + endTime;  // concatenation of both the date and time
            tableScheduleValues = tableScheduleValues.filter(schedule => schedule.reservationId != tableScheduleValues.reservationId);
            console.log('newKey: ', newKey);

            const [updatedTableSchedule] = await TableSchedule.update({ key: newKey, value: tableScheduleValues }, {
                where: {
                    id: tableSchedule.dataValues.id
                }
            });
            const [updatedReservationStatus] = await Reservation.update({ tableScheduleKey: newKey }, {
                where: {
                    restaurantId: restaurantId,
                    tableId: tableId,
                    userId: req.userId
                }
            });
        };

        const { reservationCode: reservationCode, ...ReservationInfo } = updatedReservation.dataValues;

        return res.status(200).json({ message: "Reservation updated successfully", updatedReservation: ReservationInfo });
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
    }
}


module.exports = { createReservation, getAllPendingReservations, reservationStatusController, deleteReservationTemporary };
