const DataTypes = require("sequelize");

'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TableSchedule extends Model {
    static associate(models) {
      // define association here

      // TableSchedule <-- Table (Many to One)
      TableSchedule.belongsTo(models.Table, {
        foreignKey: "tableId",
        as: "table"
      });
    };
  };
  TableSchedule.init({
    key: DataTypes.STRING,
    value: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'TableSchedule',
  });
  return TableSchedule;
};