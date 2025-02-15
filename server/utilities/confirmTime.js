const { TableSchedule } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { constants } = require("../constants");


const confirmTime = async (reservationDate, reservationStartTime, reservationEndTime, tableId) => {
    try {
        // Get the reservation times
        const tableSchedule = await TableSchedule.findOne({
            where: {
                key: reservationDate,
                tableId: tableId
            }
        });
        if (!tableSchedule) {
            const tableScheduleId = uuidv4();

            const tableSchedule_ = await TableSchedule.create({
                id: tableScheduleId,
                key: reservationDate,
                value: [],
                tableId: tableId
            });
            return { value: true, message: "Selected time is available for booking" };
        };

        const tableScheduleValuesConfirmed = tableSchedule.dataValues.value.filter(schedule => schedule.status === "confirmed");

        if (tableScheduleValuesConfirmed.length !== 0) {
            for (let i = 0; i < tableScheduleValuesConfirmed.length; i++) {
                let start = new Date(tableScheduleValuesConfirmed[i].startTime);
                let end = new Date(tableScheduleValuesConfirmed[i].endTime);
                end.setMinutes(end.getMinutes() + constants.buffer);
                console.log(`Schedule${i} Start Time: ${start}`);
                console.log(`Schedule${i} End Time: ${end}`);
                // Check if reservation start or end time is inbetween any existing schedule
                if (reservationStartTime >= start && reservationStartTime < end) {
                    return { value: false, message: "Selected time is conflicting with an existing reservation" };
                };
                if (reservationEndTime > start && reservationEndTime <= end) {
                    return { value: false, message: "Selected time is conflicting with an existing reservation" };
                };
                // Check if any existing schedule is in between reservation start or end time
                if (start >= reservationStartTime && start < reservationEndTime) {
                    return { value: false, message: "Selected time is conflicting with an existing reservation" };
                };
                if (end > reservationStartTime && end <= reservationEndTime) {
                    return { value: false, message: "Selected time is conflicting with an existing reservation" };
                };
            };
        };

        return { value: true, message: "Selected time is available for booking" };
    } catch (error) {
        console.log(error);
        return { message: error.message };
    };
};


module.exports = { confirmTime };
