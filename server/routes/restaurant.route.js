const express = require("express");
const { getRestaurantBranches } = require("../controllers/restaurant.controller.js");

const router = express.Router();

router.get('/get-all/', getRestaurantBranches);  // get all restaurants

module.exports = router;
