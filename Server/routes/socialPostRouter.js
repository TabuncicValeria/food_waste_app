import express from 'express';
import SocialPost from '../entities/SocialPost.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const post = await SocialPost.create(req.body);
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const posts = await SocialPost.findAll();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/byFoodItem/:foodItemId', async (req, res) => {
    try {
        const posts = await SocialPost.findAll({
            where: { FoodItemId: req.params.foodItemId }
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
