import express from 'express';
import Claim from '../entities/Claim.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const claim = await Claim.create(req.body);
        res.status(201).json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const claims = await Claim.findAll();
        res.status(200).json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const claim = await Claim.findByPk(req.params.id);
        if (!claim) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const claim = await Claim.findByPk(req.params.id);
        if (!claim) return res.status(404).json({ message: 'Not found' });
        await claim.update(req.body);
        res.status(200).json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const claim = await Claim.findByPk(req.params.id);
        if (!claim) return res.status(404).json({ message: 'Not found' });
        await claim.destroy();
        res.status(200).json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
