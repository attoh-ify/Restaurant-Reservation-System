const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Staff, Restaurant, Table, Reservation } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { STAFF_ROLES } = require("../constants")


// Staff
const createStaffAccount = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // check if email is taken
        const emailExists = await Staff.findOne({
            where: {
                email: email
            }
        });

        if (emailExists) return res.status(401).json({ message: 'Email already registered' });

        // check if username is taken
        const usernameExists = await Staff.findOne({
            where: {
                username: username
            }
        });

        if (usernameExists) return res.status(401).json({ message: 'Username already registered' });

        // Create Staff
        // hash password
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        const staffId = uuidv4();

        console.log(STAFF_ROLES.STAFF);

        // Create Staff
        const newStaff = await Staff.create({
            id: staffId,
            username: username,
            email: email,
            password: hashedPassword,
            role: STAFF_ROLES.STAFF
        });

        return res.status(200).json({ message: `${username}'s staff account created successfully` });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to create staff account" });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check if email exists
        const staff = await Staff.findOne({
            where: {
                email: email
            }
        });

        if (!staff) return res.status(401).json({ message: 'Invalid Credentials' });

        // check if inputed password matches user password
        const isPasswordValid = await bcrypt.compare(password, staff.password);

        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid Credentials' });

        // create cookie
        const age = 1000 * 60 * 60 * 24  // token lasts for 24 hours

        const token = jwt.sign(
            {
                id: staff.id
            }, process.env.JWT_SECRET_KEY, { expiresIn: age });

        const { password: staffPassword, ...staffInfo } = staff.dataValues;

        res.cookie("staffToken", token, {
            httpOnly: true,
            // secure: true,  // uncomment before production
            maxAge: age,
        }).status(200).json({ userInfo: staffInfo, message: 'Login successful' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to login staff" });
    }
};


const logout = async (req, res) => {
    try {
        res.clearCookie("staffToken").status(200).json({ message: "Logout successful" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to logout staff" });
    };
};


const getStaffProfile = async (req, res) => {
    try {
        const staffProfile = await Staff.findOne({
            where: {
                id: req.staffId || req.adminId
            }
        });

        const { password: staffPassword, ...staffInfo } = staffProfile.dataValues;

        return res.status(200).json({ userProfileDetails: staffInfo });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to get staffs profile" });
    };
};


const updateStaffProfile = async (req, res) => {
    try {
        const { password, ...staffDetails } = req.body;

        // hash password
        if (password) {
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);

            staffDetails.password = hashedPassword;
        };

        const [updatedProfile] = await Staff.update(staffDetails, {
            where: {
                id: req.staffId || req.adminId
            }
        });

        const newStaffProfile = await Staff.findOne({
            where: {
                id: req.staffId
            }
        });
        const { password: staffPassword, ...staffInfo } = newStaffProfile.dataValues;

        return res.status(200).json({ staffProfileDetails: staffInfo });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to update staff profile" });
    }
};


const changeStaffRole = async (req, res) => {
    try {
        const { id, role } = req.body;

        const [updatedProfile] = await Staff.update({ role }, {
            where: {
                id: id
            }
        });

        const newStaffProfile = await Staff.findOne({
            where: {
                id: id
            }
        });
        const { password: staffPassword, ...staffInfo } = newStaffProfile.dataValues;

        return res.status(200).json({ newStaffProfile: staffInfo });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to update staff profile" });
    }
};


// Auth
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const deletedUser = await User.destroy({
            where: {
                id: userId
            }
        });

        // Check if the user exists and was deleted
        if (deletedUser) {
            return res.status(200).json({ message: 'User deleted successfully' });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to delete user" });
    }
};


// Restaurant
const addRestaurantBranch = async (req, res) => {
    try {
        const { name, email, phone, phone2, address, region, description, openingHours } = req.body;

        const branchExist = await Restaurant.findOne({
            where: {
                email: email
            }
        });
        if (branchExist) { return res.status(400).json({ message: "Restaurant branch already exists" }) };

        if ([name, email, phone, address, region, description, openingHours].some(field => field === null || field === "")) {
            return res.status(200).json({ message: "name, email, phone, address, region, description, and openingHours field can not be empty" })
        };

        const restaurantId = uuidv4();

        const newRestaurant = await Restaurant.create({
            id: restaurantId,
            name: name,
            email: email,
            phone: phone,
            phone2: phone2,
            address: address,
            region: region,
            description: description,
            openingHours: openingHours
        });

        return res.status(200).json({ message: "Restaurant Branch added successfully", data: newRestaurant.dataValues });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to add new Restaurant branch" });
    }
};


const updateRestaurantBranch = async (req, res) => {
    try {
        const { name, email, phone, phone2, address, description, openingHours, restaurantId } = req.body

        if ([name, email, phone, address, description, openingHours, restaurantId].some(field => field === null || field === "")) {
            return res.status(200).json({ message: "name, email, phone, address, description, openingHours, and restaurantId field can not be empty" })
        };

        const data = { name, email, phone, phone2, address, description, openingHours };

        const updatedData = fields.reduce((acc, field) => {
            if (data[field] !== undefined) { // Check if the field exists in the data object
                acc[field] = data[field]; // Assign the field value
            }
            return acc;
        }, {});

        const [updatedRestaurantBranch] = await Restaurant.update({ updatedData }, {
            where: {
                id: req.restaurantId
            }
        });

        const newRestaurantBranchDetails = await Restaurant.findOne({
            where: {
                id: req.restaurantId
            }
        });

        return res.status(200).json({ message: "Branch details updated Successfully!", data: newRestaurantBranchDetails.dataValues });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to update Restaurant branch" });
    }
};


// const deleteRestaurantBranch = async (req, res) => {
//     try {
//         const { restaurantId } = req.body;

//         const deletedRestaurantBranch = await Restaurant.destroy({
//             where: {
//                 id: restaurantId
//             }
//         });

//         // Check if the Restaurant branch exists and was deleted
//         if (deletedRestaurantBranch) {
//             return res.status(200).json({ message: 'Restaurant branch deleted successfully' });
//         } else {
//             return res.status(404).json({ message: 'User not found' });
//         }
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Failed to delete Restaurant branch" });
//     }
// };


// Table
const addTable = async (req, res) => {
    try {
        const { capacity, isOutdoor, specialFeatures, isAvailable, restaurantId } = req.body;

        if ([capacity, isOutdoor, specialFeatures, isAvailable, restaurantId].some(field => field === null || field === "")) {
            return res.status(200).json({ message: "capacity, isOutdoor, specialFeatures, isAvailable, and restaurantId field can not be empty" })
        };

        const tableId = uuidv4();

        const newTable = await Table.create({
            id: tableId,
            capacity: capacity,
            isOutdoor: isOutdoor,
            specialFeatures: specialFeatures,
            isAvailable: isAvailable,
            restaurantId: restaurantId
        });

        return res.status(200).json({ message: "Table added successfully", data: newTable.dataValues });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to add new table to restaurant branch" });
    }
};


const updateTable = async (req, res) => {
    try {
        const { capacity, isOutdoor, specialFeatures, isAvailable, tableId } = req.body

        if ([capacity, isOutdoor, specialFeatures, isAvailable].some(field => field === null || field === "")) {
            return res.status(200).json({ message: "capacity, isOutdoor, specialFeatures, and isAvailable field can not be empty" })
        };

        const data = { capacity, isOutdoor, specialFeatures, isAvailable };

        const updatedData = fields.reduce((acc, field) => {
            if (data[field] !== undefined) { // Check if the field exists in the data object
                acc[field] = data[field]; // Assign the field value
            }
            return acc;
        }, {});

        const [updatedTable] = await Table.update({ updatedData }, {
            where: {
                id: req.tableId
            }
        });

        const newTableDetails = await Table.findOne({
            where: {
                id: req.tableId
            }
        });

        return res.status(200).json({ message: "Table details updated Successfully!", data: newTableDetails.dataValues });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to update Table details" });
    }
};


const deleteTable = async (req, res) => {
    try {
        const { tableId } = req.body;

        const tableBranch = await Restaurant.destroy({
            where: {
                id: tableId
            }
        });

        // Check if the Table exists and was deleted from Restaurant branch
        if (tableBranch) {
            return res.status(200).json({ message: 'Table deleted successfully from Restaurant Branch' });
        } else {
            return res.status(404).json({ message: 'Table not found' });
        };
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to delete Table from Restaurant branch" });
    }
};


// Reservation
const getAllPendingReservations = async (req, res) => {
    try {
        const { restaurantId, tableId } = req.body;

        let where = {};

        if (restaurantId) where.restaurantId = restaurantId;
        if (tableId) where.tableId = tableId;

        const pendingReservations = await Reservation.findAll({
            where,
        });

        return res.status(200).json({ data: pendingReservations.dataValues });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to get all pending reservation" });
    };
};


module.exports = {
    createStaffAccount, login, logout, getStaffProfile, updateStaffProfile,
    changeStaffRole, deleteUser, addRestaurantBranch, updateRestaurantBranch, addTable,
    updateTable, deleteTable, getAllPendingReservations
};  // deleteRestaurantBranch
