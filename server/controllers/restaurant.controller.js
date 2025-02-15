const { Restaurant } = require("../models");


const getRestaurantBranches = async (req, res) => {
    try {
        const branches = await Restaurant.findAll();
        return res.status(200).json({ data: branches });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to fetch restaurant branches" });
    };
};


module.exports = { getRestaurantBranches };
