import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const GroupMember = db.define("GroupMember",
{
    GroupMemberId:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    GroupId:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    UserId:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    FoodTag:
    {
        type: Sequelize.STRING,
        allowNull: true
        // vegetarian, carnivor, iubitor de zacusca etc.
    }
});

export default GroupMember;
