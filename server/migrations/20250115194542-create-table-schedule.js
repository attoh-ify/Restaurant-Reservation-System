const DataTypes = require("sequelize");

'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TableSchedules', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      value: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      tableId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Tables',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TableSchedules');
  }
};