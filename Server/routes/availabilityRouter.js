import express from 'express';
import Availability from '../entities/Availability.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const availability = await Availability.create(req.body);
        res.status(201).json(availability);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const list = await Availability.findAll();
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const availability = await Availability.findByPk(req.params.id);
        if (!availability) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(availability);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const availability = await Availability.findByPk(req.params.id);
        if (!availability) return res.status(404).json({ message: 'Not found' });
        await availability.update(req.body);
        res.status(200).json(availability);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const availability = await Availability.findByPk(req.params.id);
        if (!availability) return res.status(404).json({ message: 'Not found' });
        await availability.destroy();
        res.status(200).json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
