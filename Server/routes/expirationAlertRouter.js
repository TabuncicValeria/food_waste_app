import express from 'express';
import ExpirationAlert from '../entities/ExpirationAlert.js';
import FoodItem from '../entities/FoodItem.js';
import Sequelize from 'sequelize';

const router = express.Router();
const Op = Sequelize.Op;

/* CREATE alert manual */
router.post('/', async (req, res) => {
    try {
        const alert = await ExpirationAlert.create(req.body);
        res.status(201).json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* GET all alerts */
router.get('/', async (req, res) => {
    try {
        const alerts = await ExpirationAlert.findAll();
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* GET expiring food items (X days) */
router.get('/expiring/:days', async (req, res) => {
    try {
        const days = parseInt(req.params.days);
        const today = new Date();
        const limitDate = new Date();
        limitDate.setDate(today.getDate() + days);

        const items = await FoodItem.findAll({
            where: {
                ExpirationDate: {
                    [Op.between]: [today, limitDate]
                }
            }
        });

        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
