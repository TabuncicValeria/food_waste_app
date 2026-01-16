import db from '../dbConfig.js';
import Sequelize from 'sequelize';

const SocialPost = db.define("SocialPost", {
    SocialPostId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    Platform: {
        type: Sequelize.STRING,
        allowNull: false
    },

    Message: {
        type: Sequelize.STRING,
        allowNull: false
    },

    PostDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },

    PostStatus: {
        type: Sequelize.STRING,
        defaultValue: "posted"
    },

    FoodItemId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

export default SocialPost;
