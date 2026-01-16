import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const Availability = db.define("Availability",
{
    AvailabilityId:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    AvailableFrom:
    {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },

    FoodItemId:
    {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
    },

    OwnerId:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

export default Availability;
