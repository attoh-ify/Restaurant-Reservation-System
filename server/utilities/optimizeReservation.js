const { constants } = require("../constants");
const { TableSchedule } = require("../models");
const { sortSchedule } = require("../utilities/sortSchedule");


const optimizeReservation = async (reservationDate, reservationSchedule, tableId) => {
    try {
        console.log("Optimizing Reservations...");
        // Get the reservation times
        const tableSchedule = await TableSchedule.findOne({
            where: {
                key: reservationDate,
                tableId: tableId
            }
        });

        if (Array.isArray(tableSchedule.dataValues.value) && tableSchedule.dataValues.value.length === 0) {
            reservationSchedule.status = "confirmed";
            const [updatedTableSchedule] = await TableSchedule.update({ value: [reservationSchedule] }, {
                where: {
                    id: tableSchedule.dataValues.id
                }
            });
            console.log("new Tables Schedule value: ", [reservationSchedule]);
            console.log("Done optimizing reservations...");
            return {
                message: "Reservation has been successfully created. We look forward to having you!",
                optimized: false
            };
        };

        let startTime = new Date(reservationSchedule.startTime);
        let endTime = new Date(reservationSchedule.endTime);
        let tableScheduleValuesConfirmed = tableSchedule.dataValues.value.filter(schedule => schedule.status === "confirmed");  // array of all the table schedules that are confirmed
        let tableScheduleValuesNotConfirmed = tableSchedule.dataValues.value.filter(schedule => schedule.status !== "confirmed");  // array of all the table schedules that are not confirmed
        console.log("startTime: ", startTime);
        console.log("endTime: ", endTime);
        console.log("tableScheduleValuesConfirmed: ", tableScheduleValuesConfirmed);
        console.log("tableScheduleValuesNotConfirmed: ", tableScheduleValuesNotConfirmed);

        let schedule = sortSchedule(tableScheduleValuesConfirmed, reservationSchedule);
        console.log("Sorted schedule: ", schedule);
        console.log("tableScheduleValuesConfirmed: ", tableScheduleValuesConfirmed);
        const reservationScheduleIndex = schedule.findIndex(reservation => reservation.reservationId === reservationSchedule.reservationId);
        const prevReservationScheduleIndex = reservationScheduleIndex - 1;

        if (schedule[prevReservationScheduleIndex]) {  // there is a reservartion before the users selected reservation with a small time  gape in between, so we need to adjust to make sure there is minimum time in between them
            const prevReservation = schedule[prevReservationScheduleIndex];
            let prevReservationEndTime = new Date(prevReservation.endTime);
            prevReservationEndTime.setMinutes(prevReservationEndTime.getMinutes() + constants.buffer); // factor in the buffer after each reservation
            const reservationTimeGap = Math.abs(((prevReservationEndTime - startTime) / (1000 * 60)));
            console.log("reservationTimeGap: ", reservationTimeGap);
            let adjustableTime;
            if (0 < reservationTimeGap && reservationTimeGap < 120) {
                adjustableTime = reservationTimeGap;
            } else if (120 < reservationTimeGap && reservationTimeGap < 150) {
                adjustableTime = reservationTimeGap - 120;
            } else if (150 < reservationTimeGap && reservationTimeGap < 180) {
                adjustableTime = reservationTimeGap - 150;
            } else if (180 < reservationTimeGap && reservationTimeGap < 210) {
                adjustableTime = reservationTimeGap - 180;
            } else if (210 < reservationTimeGap && reservationTimeGap < 240) {
                adjustableTime = reservationTimeGap - 210;
            } else {
                schedule = schedule.map(schedule =>
                    schedule.reservationId === reservationSchedule.reservationId
                        ? { ...schedule, status: "confirmed" }
                        : schedule
                );
                const [updatedTableSchedule] = await TableSchedule.update({ value: schedule }, {
                    where: {
                        id: tableSchedule.dataValues.id
                    }
                });
                console.log("Done optimizing reservations...");
                return {
                    message: "Reservation has been successfully created. We look forward to having you!",
                    optimized: false
                };
            };
            console.log("adjustableTime: ", adjustableTime);
            let newReservationStartTime = new Date(startTime);
            let newReservationEndTime = new Date(endTime);
            newReservationStartTime.setMinutes(newReservationStartTime.getMinutes() - adjustableTime);
            newReservationEndTime.setMinutes(newReservationEndTime.getMinutes() - adjustableTime);
            reservationSchedule.startTime = newReservationStartTime;
            reservationSchedule.endTime = newReservationEndTime;
            schedule = sortSchedule(tableScheduleValuesConfirmed, reservationSchedule);
            console.log("schedule: ", schedule);
            console.log("tableScheduleValuesConfirmed: ", tableScheduleValuesConfirmed);
            console.log("tableScheduleValuesNotConfirmed: ", tableScheduleValuesNotConfirmed);
            let totalSchedule = [...schedule, ...tableScheduleValuesNotConfirmed];
            console.log("newReservationStartTime: ", newReservationStartTime);
            console.log("newReservationEndTime: ", newReservationEndTime);
            console.log("newReservationSchedule: ", reservationSchedule);
            console.log("newTableSchedule: ", totalSchedule);
            const [updatedTableSchedule] = await TableSchedule.update({ value: totalSchedule }, {
                where: {
                    id: tableSchedule.dataValues.id
                }
            });
            console.log("Done optimizing reservations...");
            return {
                message: "An adjustment was made to your selected time to maximize the use of the table. Please confirm if it would okay by you or select another available time for the reservation.",
                optimized: true
            };
        } else {  // no reservation exists before the users selected reservation time so just confirm the reservation
            schedule = schedule.map(schedule =>
                schedule.reservationId === reservationSchedule.reservationId
                    ? { ...schedule, status: "confirmed" }
                    : schedule
            );
            const [updatedTableSchedule] = await TableSchedule.update({ value: schedule }, {
                where: {
                    id: tableSchedule.dataValues.id
                }
            });
            console.log("Done optimizing reservations...");
            return {
                message: "Reservation has been successfully created. We look forward to having you!",
                optimized: false
            };
        };
    } catch (error) {
        console.log(error);
        return { message: error.message };
    };
};


module.exports = { optimizeReservation };
