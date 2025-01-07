'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Table extends Model {
    static associate(models) {
      // define association

      // Table <-- Restaurant (Many to One)
      Table.belongsTo(models.Restaurant, {
        foreignKey: "restaurantId",
        as: "restaurant"
      });

      // Table --> Reservation (One to Many)
      Table.hasMany(models.Reservation, {
        foreignKey: "tableId",
        as: "reservations"
      })
    };
  }
  Table.init({
    capacity: DataTypes.INTEGER,
    isOutdoor: DataTypes.BOOLEAN,
    specialFeatures: DataTypes.ARRAY(DataTypes.STRING),
    isAvailable: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Table',
  });
  return Table;
};