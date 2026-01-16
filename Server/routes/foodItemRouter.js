import express from 'express';
import FoodItem from '../entities/FoodItem.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const item = await FoodItem.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const items = await FoodItem.findAll();
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const item = await FoodItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const item = await FoodItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        await item.update(req.body);
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const item = await FoodItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        await item.destroy();
        res.status(200).json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
