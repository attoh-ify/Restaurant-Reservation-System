const express = require("express");
const { getAllTables, filterTables, getTableSchedule, deleteTableSchedule } = require("../controllers/table.controller.js");

const router = express.Router();

router.get('/get-all/', getAllTables);  // get all tables
router.get('/filter/', filterTables);  // filter for tables
router.get('/get-table-schedule/', getTableSchedule);  // get table schedules
router.delete('/delete-table-schedule/', deleteTableSchedule);  // get table schedules

module.exports = router;
