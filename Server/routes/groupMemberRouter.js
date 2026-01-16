import express from 'express';
import GroupMember from '../entities/GroupMember.js';

const router = express.Router();

/* CREATE GroupMember */
router.post('/', async (req, res) => {
    try {
        const groupMember = await GroupMember.create(req.body);
        res.status(201).json(groupMember);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* GET all GroupMembers */
router.get('/', async (req, res) => {
    try {
        const members = await GroupMember.findAll();
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* GET GroupMembers by GroupId */
router.get('/byGroup/:groupId', async (req, res) => {
    try {
        const members = await GroupMember.findAll({
            where: { GroupId: req.params.groupId }
        });
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* GET GroupMembers by UserId */
router.get('/byUser/:userId', async (req, res) => {
    try {
        const members = await GroupMember.findAll({
            where: { UserId: req.params.userId }
        });
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* UPDATE FoodTag */
router.put('/:id', async (req, res) => {
    try {
        const member = await GroupMember.findByPk(req.params.id);
        if (!member) {
            return res.status(404).json({ error: 'GroupMember not found' });
        }

        await member.update(req.body);
        res.json(member);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* DELETE GroupMember */
router.delete('/:id', async (req, res) => {
    try {
        const member = await GroupMember.findByPk(req.params.id);
        if (!member) {
            return res.status(404).json({ error: 'GroupMember not found' });
        }

        await member.destroy();
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
