const { Reservation, TableSchedule } = require("./models");
const { trackPendingReservation } = require("./utilities/trackPendingReservation")
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


server.listen(PORT, async () => {
    console.log(`Server running on Port ${PORT}...`);
    try {
        const reservations = await Reservation.findAll({
            where: {
                status: "pending"
            }
        });
        if (reservations.length > 0) {
            const currentTime = new Date();

            await Promise.all(
                reservations.map(async (reservation) => {
                    const pendingReservationCreatedTime = new Date(reservation.createdAt);
                    const timeDifference = (currentTime - pendingReservationCreatedTime) / (1000 * 60); // Difference in minutes

                    if (timeDifference <= constants.pendingReservationGrace) {
                        await trackPendingReservation(timeDifference, reservation.createdAt, reservation.id);
                    } else {
                        setStatus("canceled", reservation.id);
                        const tableSchedule = await TableSchedule.findOne({
                            where: {
                                tableId: reservation.tableId,
                                key: reservation.tableScheduleKey
                            }
                        });
                        const reservationTime = tableSchedule.dataValues.value.filter(schedule => schedule.reservationId === reservation.id);
                        mailer(process.env.RECEIVING_EMAIL_ADDRESS, "canceled", reservationTime);
                    };
                })
            );
        };
    } catch (error) {
        console.log(error);
    }
});
