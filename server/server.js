const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth.route.js");
const adminRoute = require('./routes/admin.route.js');
const restaurantRoute = require('./routes/restaurant.route.js');
const tableRoute = require('./routes/table.route.js');
const reservationRoute = require('./routes/reservation.route.js');

const PORT = process.env.PORT || 5000;

const server = express();

//Add middlewares
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


server.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}...`);
});
