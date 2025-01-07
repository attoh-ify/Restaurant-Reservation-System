const express = require("express");
const { register, login, logout, getProfile, updateProfile, deleteAccount } = require("../controllers/auth.controller.js");
const { verifyUserToken } = require("../middlewares/verifyToken.js");

const router = express.Router();

router.post('/register/', register);  // Register a new user
router.post('/login/', login);  // Log in a user
router.post('/logout/', verifyUserToken, logout);  // Log out a user
router.get('/profile/', verifyUserToken, getProfile);  // Get the logged-in user's profile
router.put('/profile/', verifyUserToken, updateProfile);  // Update user's profile
router.delete('/delete/', verifyUserToken, deleteAccount);  // Delete user's profile

module.exports = router;
