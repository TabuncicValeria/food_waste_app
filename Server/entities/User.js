import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const User = db.define("User",
{
    UserId:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    UserName:
    {
        type: Sequelize.STRING,
        allowNull: false
    },

    UserEmail:
    {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },

    UserPassword:
    {
        type: Sequelize.STRING,
        allowNull: false
    },

    FoodPreference:
    {
        type: Sequelize.STRING,
        allowNull: true
        // ex: vegetarian, carnivor, vegan etc.
    },

    CreatedAt:
    {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
});

export default User;
