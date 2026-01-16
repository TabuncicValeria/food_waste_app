import express from 'express';
import FriendGroup from '../entities/FriendGroup.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const group = await FriendGroup.create(req.body);
        res.status(201).json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const groups = await FriendGroup.findAll();
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
