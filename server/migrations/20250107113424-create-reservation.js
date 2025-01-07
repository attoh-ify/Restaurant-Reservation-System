const DataTypes = require('sequelize');

'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reservations', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true
      },
      reservationTime: {
        type: DataTypes.STRING,
        allowNull: true
      },
      partySize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("confirmed", "pending", "canceled", "completed"),
        allowNull: false,
        defaultValue: "pending",
      },
      reservationCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Reservations');
  }
};