const { Reservation, TableSchedule } = require("../models");
const { mailer } = require("../services/mailer");


const setStatus = async (status, reservationId) => {
    try {
        // - ensure all time variables are not empty
        if (!reservationId || !status) {
            return { message: "reservationId and status are required." };
        };

        const reservation = await Reservation.findOne({
            where: {
                id: reservationId
            }
        });

        // Check if reservation has already been canceled
        if (reservation.dataValues.status === "canceled") { return { message: "This reservation has already been canceled and status can not be altered" } };

        // Check if reservation has already been completed
        if (reservation.dataValues.status === "completed") { return { message: "This reservation has already been completed and status can not be altered" } };

        // Check if the User is trying to change to the same status
        if (reservation.dataValues.status === status) { return { message: `This reservation is already ${status}` } };

        // Check if user is passing the appropriate response
        if (status !== "confirmed" && status !== "canceled") {
            return { message: "Invalid response status from user" };
        };

        // Update the reservation status
        const [updatedReservationStatus] = await Reservation.update({ status: status }, {
            where: {
                id: reservationId
            }
        });

        // Update the table schedule status
        // -get table schedule
        const tableId = reservation.dataValues.tableId;
        const key = reservation.dataValues.tableScheduleKey;
        const tableSchedule = await TableSchedule.findOne({
            where: {
                tableId,
                key
            }
        });
        // -modify the Table Schedule for that reservation
        let tableScheduleValues = tableSchedule.dataValues.value.map(schedule =>
            schedule.reservationId === reservationId
                ? { ...schedule, status: status }
                : schedule
        );
        // -update the Table Schedule
        const [updatedTableSchedule] = await TableSchedule.update({ value: tableScheduleValues }, {
            where: {
                tableId,
                key
            }
        });

        const reservationTime = tableScheduleValues.filter(schedule => schedule.reservationId === reservationId);
        mailer(process.env.RECEIVING_EMAIL_ADDRESS, status, reservationTime);
    } catch (error) {
        console.log(error);
    };
};


module.exports = { setStatus };
