const jwt = require("jsonwebtoken");
const { User, Staff } = require("../models");

const verifyUserToken = (req, res, next) => {
    const token = req.cookies.userToken;

    if (!token) return res.status(401).json({ message: "Token not found" });

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) return res.status(401).json({ message: "Token not valid" });
        req.userId = payload.id;

        next();
    })
};


const verifyStaffToken = (req, res, next) => {
    const token = req.cookies.staffToken;

    if (!token) return res.status(401).json({ message: "Token not found" });

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) return res.status(401).json({ message: "Token not valid" });
        const staff = await Staff.findOne({
            where: {
                id: payload.id
            }
        });
        if (staff.role === 'staff') {
            req.staffId = payload.id;
        } else {
            return res.status(403).json({ message: "Staff access required" });
        };

        next();
    })
};


const verifyAdminToken = (req, res, next) => {
    const token = req.cookies.staffToken;

    if (!token) return res.status(401).json({ message: "Token not found" });

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) return res.status(401).json({ message: "Token not valid" });
        const staff = await Staff.findOne({
            where: {
                id: payload.id
            }
        });
        if (staff.role === 'admin') {
            req.adminId = payload.id;
        } else {
            return res.status(403).json({ message: "Admin access required" });
        };

        next();
    })
};


const verifyStaffOrAdminToken = (req, res, next) => {
    const token = req.cookies.staffToken;

    if (!token) return res.status(401).json({ message: "Token not found" });

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) return res.status(401).json({ message: "Token not valid" });
        const staff = await Staff.findOne({
            where: {
                id: payload.id
            }
        });
        if (staff.role === 'staff') {
            req.staffId = payload.id;
        } else if (staff.role === 'admin') {
            req.adminId = payload.id;
        } else {
            return res.status(403).json({ message: "Staff or Admin access required" });
        };

        next();
    })
};


module.exports = { verifyUserToken, verifyStaffToken, verifyAdminToken, verifyStaffOrAdminToken };
