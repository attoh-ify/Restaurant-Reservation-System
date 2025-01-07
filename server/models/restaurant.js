'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Restaurant extends Model {
    static associate(models) {
      // define association

      // Restaurant --> Table (One to Many)
      Restaurant.hasMany(models.Table, {
        foreignKey: "restaurantId",
        as: "tables"
      });

      // Restaurant --> Reservation (One to Many)
      Restaurant.hasMany(models.Reservation, {
        foreignKey: "restaurantId",
        as: "reservations"
      });
    };
  }
  Restaurant.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    phone2: DataTypes.STRING,
    address: DataTypes.STRING,
    description: DataTypes.STRING,
    openingHours: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Restaurant',
  });
  return Restaurant;
};