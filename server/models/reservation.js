'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    static associate(models) {
      // define association

      // Reservation <-- User (Many to One)
      Reservation.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      });

      // Reservation <-- Restaurant (Many to One)
      Reservation.belongsTo(models.Restaurant, {
        foreignKey: "restaurantId",
        as: "restaurant"
      });

      // Reservation <-- Table (Many to One)
      Reservation.belongsTo(models.Table, {
        foreignKey: "tableId",
        as: "table"
      });
    };
  }
  Reservation.init({
    reservationTime: DataTypes.STRING,
    partySize: DataTypes.INTEGER,
    status: DataTypes.ENUM("confirmed", "pending", "canceled", "completed"),
    reservationCode: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Reservation',
  });
  return Reservation;
};