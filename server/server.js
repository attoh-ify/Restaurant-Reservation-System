const { Reservation, TableSchedule } = require("./models");
const { setReservationAlert } = require("./utilities/setReservationAlert.js")
const { setStatus } = require("./utilities/setStatus");
const { mailer } = require("./services/mailer");
const { constants } = require("./constants");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth.route.js");
const adminRoute = require('./routes/admin.route.js');
const restaurantRoute = require('./routes/restaurant.route.js');
const tableRoute = require('./routes/table.route.js');
const reservationRoute = require('./routes/reservation.route.js');
const webhooksRoute = require('./routes/webhooks.route.js');

const PORT = process.env.PORT || 5000;

const server = express();

//Add middlewares
server.use("/webhook", express.raw({ type: "application/json" }));  // DO NOT use express.json() for Stripe webhooks
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(cookieParser());
server.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));


server.use('/auth', authRoute);
server.use('/admin', adminRoute);
server.use('/restaurant', restaurantRoute);
server.use('/table', tableRoute);
server.use('/reservation', reservationRoute);
server.use('/webhook', webhooksRoute);


const checker = async (status) => {
    try {
        let notifyAt;
        if (!status) {
            console.log("status argument is required");
            return;
        };
        const reservations = await Reservation.findAll({
            where: {
                status
            }
        });
        if (reservations.length > 0) {
            const currentTime = new Date();

            await Promise.all(
                reservations.map(async (reservation) => {
                    if (status === "pending") {
                        notifyAt = reservation.dataValues.createdAt;
                        // Add pending reservation grace time to the notifyTime
                        let notifyTime = new Date(notifyAt);
                        notifyTime.setMinutes(notifyTime.getMinutes() + constants.pendingReservationGrace);
                        const timeDifference = (currentTime - notifyTime) / (1000 * 60); // Difference in minutes
                        if (timeDifference <= 0) {
                            setStatus("canceled", reservation.id);
                        } else {
                            await setReservationAlert(notifyAt, reservation.id, "pending");
                        };
                    } else if (status === "confirmed") {
                        const tableSchedule = await TableSchedule.findOne({
                            where: {
                                tableId: reservation.tableId,
                                key: reservation.tableScheduleKey
                            }
                        });
                        notifyAt = tableSchedule.dataValues.value.filter(schedule => schedule.reservationId === reservation.id)[0].startTime;
                        const notifyTime = new Date(notifyAt);
                        const timeDifference = (notifyTime - currentTime) / (1000 * 60); // Difference in minutes
                        let reservationEndTime = tableSchedule.dataValues.value.filter(schedule => schedule.reservationId === reservation.id)[0].endTime;
                        if (timeDifference <= 0) {
                            if (currentTime < reservationEndTime) {
                                await setReservationAlert(reservationEndTime, reservation.id, "completed");
                            } else {
                                setStatus("completed", reservation.id);
                            };
                            console.log("first")
                        } else {
                            let reservationDate = new Date(notifyAt);
                            reservationDate = reservationDate.toLocaleDateString('en-CA');
                            let oneHourBeforeTime = new Date(notifyTime.getTime() - 60 * 60 * 1000);  // 1 hour before
                            await setReservationAlert(oneHourBeforeTime, reservation.id, "reminder1H");
                            await setReservationAlert(reservationDate, reservation.id, "reminder1D");
                        };
                    };
                })
            );
        };
    } catch (error) {
        console.log(error);
    };
};

server.listen(PORT, async () => {
    console.log(`Server running on Port ${PORT}...`);
    try {
        await checker("pending");
        await checker("confirmed");
    } catch (error) {
        console.log(error);
    }
});
