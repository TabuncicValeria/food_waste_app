import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const FriendGroup = db.define("FriendGroup",
{
    GroupId:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    GroupName:
    {
        type: Sequelize.STRING,
        allowNull: false
    },

    OwnerId:
    {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    CreatedAt:
    {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
});

export default FriendGroup;
