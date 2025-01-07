const { User } = require("../models");


// Auth
const updateUserProfile = async (req, res) => {
    const { id, role } = req.body;

    try {
        const [updatedProfile] = await User.update({role}, {
            where: {
                id: id
            }
        });

        const newUserProfile = await User.findOne({
            where: {
                id: id
            }
        });
        const { password: userPassword, ...userInfo } = newUserProfile.dataValues;

        return res.status(200).json({ userProfileDetails: userInfo });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to update user profile" });
    }
};


const deleteUser = async (req, res) => {
    const { userId } = req.body;

    try {
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


module.exports = { updateUserProfile, deleteUser };
