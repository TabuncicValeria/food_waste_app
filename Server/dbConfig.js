import Sequelize from 'sequelize';
import env from 'dotenv';

env.config();

const db = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false,
        define: {
            timestamps: false,
            freezeTableName: true
        }
    }
);

export default db;
