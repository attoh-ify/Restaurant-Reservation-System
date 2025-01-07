const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { v4: uuidv4 } = require("uuid");


const register = async (req, res) => {
    const { fullname, email, password, phone, phone2 = null } = req.body;

    try {
        // check if user exists
        const emailExists = await User.findOne({
            where: {
                email: email
            }
        });

        if (emailExists) return res.status(401).json({ message: 'Email already registered' });

        // Create User
        // hash password
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userId = uuidv4();

        // Create User
        const newUser = await User.create({
            id: userId,
            fullname: fullname,
            email: email,
            phone: phone,
            phone2: phone2,
            password: hashedPassword
        });

        return res.status(200).json({ message: `${fullname} registered successfully` });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to register user" });
    }
};


const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // check if email exists
        const user_ = await User.findOne({
            where: {
                email: email
            }
        });

        if (!user_) return res.status(401).json({ message: 'Invalid Credentials' });

        // check if inputed password matches user password
        const isPasswordValid = await bcrypt.compare(password, user_.password);

        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid Credentials' });

        // create cookie
        const age = 1000 * 60 * 60 * 24  // token lasts for 24 hours

        const token = jwt.sign(
            {
                id: user_.id
            }, process.env.JWT_SECRET_KEY, { expiresIn: age });

        const { password: userPassword, ...userInfo } = user_.dataValues;

        res.cookie("userToken", token, {
            httpOnly: true,
            // secure: true,  // uncomment before production
            maxAge: age,
        }).status(200).json({ userInfo: userInfo, message: 'Login successful' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to login user" });
    }
};


const logout = async (req, res) => {
    try {
        res.clearCookie("userToken").status(200).json({ message: "Logout successful" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to logout user" });
    };
};


const getProfile = async (req, res) => {
    try {
        const userProfile = await User.findOne({
            where: {
                id: req.userId
            }
        });

        const { password: userPassword, ...userInfo } = userProfile.dataValues;

        return res.status(200).json({ userProfileDetails: userInfo });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to get users profile" });
    }
};


const updateProfile = async (req, res) => {
    const { password, role, ...userDetails } = req.body;

    try {
        // hash password
        if (password) {
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);

            userDetails.password = hashedPassword;
        };

        const [updatedProfile] = await User.update(userDetails, {
            where: {
                id: req.userId
            }
        });

        const newUserProfile = await User.findOne({
            where: {
                id: req.userId
            }
        });
        const { password: userPassword, ...userInfo } = newUserProfile.dataValues;

        return res.status(200).json({ userProfileDetails: userInfo });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to update user profile" });
    }
};


const deleteAccount = async (req, res) => {
    try {
        const deletedUser = await User.destroy({
            where: {
                id: req.userId
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

module.exports = { register, login, logout, getProfile, updateProfile, deleteAccount };
