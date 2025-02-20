const { Reservation, TableSchedule } = require("../models");
const { mailer } = require("../services/mailer");
const cron = require("node-cron");


const checkAndAdjustReservationStatus = async (reservationId) => {  // check if reservation is still pending and cancel it if true
    try {
        const reservation = await Reservation.findOne({
            where: {
                id: reservationId
            }
        });
        if (reservation.dataValues.status === "pending") {  // check if reservation is still pending
            // Update the reservation status
            const [updatedReservationStatus] = await Reservation.update({ status: "canceled" }, {
                where: {
                    id: reservationId
                }
            });

            // Update the table schedule status
            // -get table schedule
            const tableSchedule = await TableSchedule.findOne({
                where: {
                    tableId: reservation.dataValues.tableId,
                    key: reservation.dataValues.tableScheduleKey
                }
            });
            // -modify the Table Schedule for that reservation
            let tableScheduleValues = tableSchedule.dataValues.value.map(schedule =>
                schedule.status === "pending"
                    ? { ...schedule, status: "canceled" }
                    : schedule
            );
            // -update the Table Schedule
            const [updatedTableSchedule] = await TableSchedule.update({ value: tableScheduleValues }, {
                where: {
                    id: tableSchedule.dataValues.id
                }
            });

            let reservationTime = tableScheduleValues.filter(schedule => schedule.reservationId === reservationId);
            mailer(process.env.RECEIVING_EMAIL_ADDRESS, "canceled", reservationTime);
        };
    } catch (error) {
        console.log(error)
    }
};


const formatToCron = (date) => {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;  // getMonth() returns 0-11
    const dayOfWeek = '*'; // Optional, but leaving as *

    return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
};


const trackPendingReservation = async (pendingReservationGraceTime, reservationCreationTime, reservationId) => {
    try {
        // console.log(reservationCreationTime);
        // Add pending reservation grace time to the reservation time
        let pendingReservationCreationTime = new Date(reservationCreationTime);
        pendingReservationCreationTime.setMinutes(pendingReservationCreationTime.getMinutes() + pendingReservationGraceTime);
        // console.log(pendingReservationCreationTime);

        const cronExpression = formatToCron(pendingReservationCreationTime);
        // console.log(cronExpression);

        cron.schedule(cronExpression, async () => {
            await checkAndAdjustReservationStatus(reservationId);
        });
    } catch (error) {
        console.log(error);
    };
};

module.exports = { trackPendingReservation };
