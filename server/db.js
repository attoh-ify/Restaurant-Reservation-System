const Sequelize = require("sequelize");


const sequelize = new Sequelize("RRSdb", "postgres", "password", {
    host: "localhost",
    dialect: "postgres"
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection established successfully!");
    } catch (error) {
        console.log("Unable to connect to the database: ", error);
    };
})();

export default sequelize;
