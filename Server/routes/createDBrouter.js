import express from 'express';
import DB_Init from '../entities/DB_Init.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        await DB_Init();
        res.json({ message: 'Database created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
