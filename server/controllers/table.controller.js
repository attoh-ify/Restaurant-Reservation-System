const { Table, Restaurant, TableSchedule } = require("../models");


const getAllTables = async (req, res) => {
    try {
        const allTables = await Table.findAll({
            include: [
                {
                    model: Restaurant,
                    as: "restaurant",
                    attributes: ["name", "email", "phone", "phone2", "address", "region", "description"]
                },
            ]
        });

        return res.status(200).json({ allTables: allTables });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to get all tables" });
    };
};


const filterTables = async (req, res) => {
    try {
        const { restaurantId, minCapacity, maxCapacity, isOutdoor, region } = req.body;
        const { sortBy = 'createdAt', order = 'DESC', page = 1, limit = 10 } = req.query;

        // Build the `where` clause for filtering
        const where = {};
        if (restaurantId) where.restaurantId = restaurantId;
        if (minCapacity) where.capacity = { ...(where.capacity || {}), [Op.gte]: minCapacity }; // Minimum capacity
        if (maxCapacity) where.capacity = { ...(where.capacity || {}), [Op.lte]: maxCapacity }; // Maximum capacity
        if (isOutdoor) where.isOutdoor = isOutdoor;

        // Calculate pagination
        const pageNum = parseInt(page, 10);
        const pageLimit = parseInt(limit, 10);
        const offset = (pageNum - 1) * pageLimit;

        // Query the database
        const { rows: tables, count: totalItems } = await Table.findAndCountAll({
            where,
            order: [[sortBy, order]], // Sorting
            limit: pageLimit, // Pagination limit
            offset, // Pagination offset
            include: {
                model: Restaurant,
                as: "restaurant",
                attributes: [],
                ...(region ? { where: { region } } : {}) // Conditionally add the where clause
            }
        });

        // Calculate metadata
        const totalPages = Math.ceil(totalItems / pageLimit);

        // Respond with the paginated data
        return res.status(200).json({
            tables,
            pagination: {
                totalItems,
                totalPages,
                currentPage: pageNum,
                pageSize: pageLimit,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to filter tables" });
    }
};


const getTableSchedule = async (req, res) => {
    try {
        const { key, tableId } = req.body;

        const tableSchedule = await TableSchedule.findAll({
            where: {
                key: key,
                tableId: tableId
            }
        });

        return res.status(200).json({ data: tableSchedule });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to get table schedule" });
    }
};


const deleteTableSchedule = async (req, res) => {
    try {
        const { key, tableId } = req.body;

        const tableSchedule = await TableSchedule.destroy({
            where: {
                key: key,
                tableId: tableId
            }
        });

        // Check if the Table exists and was deleted from Restaurant branch
        if (tableSchedule) {
            return res.status(200).json({ message: 'Table schedule deleted successfully from database' });
        } else {
            return res.status(404).json({ message: 'Table schedule not found' });
        };
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to delete table schedule" });
    }
};


module.exports = { getAllTables, filterTables, getTableSchedule, deleteTableSchedule };
