import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const ExpirationAlert = db.define("ExpirationAlert",
{
    AlertId:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    AlertDate:
    {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },

    AlertStatus:
    {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'unread'
        // unread | read
    },

    FoodItemId:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

export default ExpirationAlert;
