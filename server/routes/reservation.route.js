const express = require("express");
const { createReservation, getAllReservations, reservationStatusController, deleteReservationTemporary } = require("../controllers/reservation.controller.js");
const { verifyUserToken } = require("../middlewares/verifyToken.js");

const router = express.Router();

router.post('/create/', verifyUserToken, createReservation);  // create reservation
router.get('/get-all/', verifyUserToken, getAllReservations);  // get all reservation
router.post('/status/', verifyUserToken, reservationStatusController);  // confirm or cancel reservation
router.delete('/delete/', verifyUserToken, deleteReservationTemporary);  // delete reservation; temporary controller

module.exports = router;
