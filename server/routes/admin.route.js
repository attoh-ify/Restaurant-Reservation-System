const express = require("express");
const {
    createStaffAccount, login, logout, getStaffProfile, updateStaffProfile,
    changeStaffRole, deleteUser, addRestaurantBranch, updateRestaurantBranch, addTable, updateTable,
    deleteTable, getAllPendingReservations
} = require("../controllers/admin.controller.js");
const { verifyAdminToken, verifyStaffOrAdminToken } = require("../middlewares/verifyToken.js");

const router = express.Router();

// Staff
router.post('/staff/create/', verifyAdminToken, createStaffAccount);
router.post('/staff/login/', login);
router.post('/staff/logout/', logout);
router.get('/staff/profile/', verifyStaffOrAdminToken, getStaffProfile);
router.put('/staff/profile/update/', verifyStaffOrAdminToken, updateStaffProfile);
router.put('/staff/role/change/', verifyAdminToken, changeStaffRole);
// Auth
router.delete('/staff/delete', verifyAdminToken, deleteUser);
// Restaurant
router.post('/restaurant/add/', verifyAdminToken, addRestaurantBranch);
router.put('/restaurant/update/', verifyAdminToken, updateRestaurantBranch);
// router.delete('/restaurant/delete/', verifyAdminToken, deleteRestaurantBranch);
// Table
router.post('/table/add/', verifyStaffOrAdminToken, addTable);
router.put('/table/update/', verifyStaffOrAdminToken, updateTable);
router.delete('/table/delete/', verifyStaffOrAdminToken, deleteTable);
// Reservation
router.get('/reservation/get/', verifyStaffOrAdminToken, getAllPendingReservations);

module.exports = router;
