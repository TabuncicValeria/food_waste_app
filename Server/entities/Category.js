import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const Category = db.define("Category",
{
    CategoryId:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    CategoryName:
    {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    }
});

export default Category;
