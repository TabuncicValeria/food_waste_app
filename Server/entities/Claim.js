import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const Claim = db.define("Claim",
    {
        ClaimId:
        {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        ClaimDate:
        {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },

        ClaimStatus:
        {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'pending'
            // pending | accepted | rejected
        },

        UserId:
        {
            type: Sequelize.INTEGER,
            allowNull: false
        },

        FoodItemId:
        {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    });

export default Claim;
