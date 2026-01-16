import mysql from 'mysql2/promise';
import env from 'dotenv';

import User from './User.js';
import Category from './Category.js';
import FoodItem from './FoodItem.js';
import ExpirationAlert from './ExpirationAlert.js';
import Availability from './Availability.js';
import Claim from './Claim.js';
import FriendGroup from './FriendGroup.js';
import GroupMember from './GroupMember.js';
import SocialPost from './SocialPost.js';

env.config();

async function Create_DB() {
    const conn = await mysql.createConnection({
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
    });

    await conn.query(
        `CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE}`
    );

    await conn.end();
}

function FK_Config() {

    User.hasMany(FoodItem, { foreignKey: 'UserId' });
    FoodItem.belongsTo(User, { foreignKey: 'UserId' });

    Category.hasMany(FoodItem, { foreignKey: 'CategoryId' });
    FoodItem.belongsTo(Category, { foreignKey: 'CategoryId' });

    FoodItem.hasMany(ExpirationAlert, { foreignKey: 'FoodItemId' });
    ExpirationAlert.belongsTo(FoodItem, { foreignKey: 'FoodItemId' });

    FoodItem.hasOne(Availability, { foreignKey: 'FoodItemId' });
    Availability.belongsTo(FoodItem, { foreignKey: 'FoodItemId' });

    User.hasMany(Availability, { foreignKey: 'OwnerId' });
    Availability.belongsTo(User, { foreignKey: 'OwnerId' });

    User.hasMany(Claim, { foreignKey: 'UserId' });
    Claim.belongsTo(User, { foreignKey: 'UserId' });

    FoodItem.hasMany(Claim, { foreignKey: 'FoodItemId' });
    Claim.belongsTo(FoodItem, { foreignKey: 'FoodItemId' });

    User.hasMany(FriendGroup, { foreignKey: 'OwnerId' });
    FriendGroup.belongsTo(User, { foreignKey: 'OwnerId' });

    User.belongsToMany(FriendGroup, {
        through: GroupMember,
        foreignKey: 'UserId'
    });

    FriendGroup.belongsToMany(User, {
        through: GroupMember,
        foreignKey: 'GroupId'
    });

    FoodItem.hasMany(SocialPost, { foreignKey: 'FoodItemId' });
    SocialPost.belongsTo(FoodItem, { foreignKey: 'FoodItemId' });
}

async function DB_Init() {
    await Create_DB();
    FK_Config();

    await User.sync();
    await Category.sync();
    await FriendGroup.sync();
    await FoodItem.sync();
    await Availability.sync();
    await ExpirationAlert.sync();
    await Claim.sync();
    await GroupMember.sync();
    await SocialPost.sync();
}

export default DB_Init;
