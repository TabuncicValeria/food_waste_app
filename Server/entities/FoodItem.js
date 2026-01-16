import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const FoodItem = db.define("FoodItem",
{
    FoodItemId:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    FoodName:
    {
        type: Sequelize.STRING,
        allowNull: false
    },

    Quantity:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    ExpirationDate:
    {
        type: Sequelize.DATE,
        allowNull: false
    },

    Status:
    {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'normal'
        // normal | aproape_expirat | disponibil | revendicat
    },

    UserId:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    CategoryId:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

export default FoodItem;
