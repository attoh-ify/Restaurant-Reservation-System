const express = require("express");
const { createReservation, getAllPendingReservations, reservationStatusController, deleteReservationTemporary, paymentSuccessful, paymentFailed } = require("../controllers/reservation.controller.js");
const { verifyUserToken } = require("../middlewares/verifyToken.js");

const router = express.Router();

router.post('/create/', verifyUserToken, createReservation);  // create reservation
router.get('/get-all/', verifyUserToken, getAllPendingReservations);  // create reservation
router.post('/status/', verifyUserToken, reservationStatusController);  // confirm or cancel reservation
router.delete('/delete/', verifyUserToken, deleteReservationTemporary);  // delete reservation; temporary controller

module.exports = router;
