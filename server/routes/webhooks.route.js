const express = require("express");
const { stripeWebhook } = require("../controllers/webhooks.controller.js");

const router = express.Router();

router.post('/stripe', stripeWebhook);  // stripe payment webhook

module.exports = router;
