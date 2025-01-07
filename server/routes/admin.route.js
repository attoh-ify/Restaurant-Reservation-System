const express = require("express");
const { updateUserProfile, deleteUser } = require("../controllers/admin.controller.js");
const { verifyAdminToken } = require("../middlewares/verifyToken.js");

const router = express.Router();

// Auth
router.put('/user/update/', verifyAdminToken, updateUserProfile);
router.delete('/user/delete', verifyAdminToken, deleteUser);

module.exports = router;
