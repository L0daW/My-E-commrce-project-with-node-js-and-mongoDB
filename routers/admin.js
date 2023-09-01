const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const { body, validationResult } = require('express-validator');
const Item = require('../models/item');
const User = require('../models/user');
const { NotFoundError, InternalServerError } = require('../customError');

const router = new express.Router();

// Add an item to the shop
router.post('/admin/items', adminAuth, async (req, res) => {
    const item = new Item(req.body);

    try {
        await item.save();
        res.status(201).send(item);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Edit an item
router.patch('/admin/items/:id', adminAuth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'price', 'description'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!item) {
            throw new NotFoundError('Item not found');
        }

        res.send(item);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete an item
router.delete('/admin/items/:id', adminAuth, async (req, res) => {
    try {
        let item;

        try {
            item = await Item.findByIdAndDelete(req.params.id);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(404).send({ message: 'Item not found' });
            }
            throw error;
        }

        if (!item) {
            return res.status(404).send({ message: 'Item not found' });
        }

        res.send({ message: `Item '${item.name}' got deleted successfully!` });
    } catch (error) {
        res.status(500).send(error);
    }
});


// Get user by ID
router.get('/admin/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});


// Get all users
router.get('/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Delete a user
router.delete('/admin/users/:id', adminAuth, async (req, res) => {
    try {
        let user;

        try {
            user = await User.findByIdAndDelete(req.params.id);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(404).send({ message: 'User not found' });
            }
            throw error;
        }

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.send({ message: `The user "${user.firstName} ${user.lastName}" got deleted successfully!` });
    } catch (error) {
        res.status(500).send(error);
    }
});



// Make other users admin or demote them
router.patch('/admin/users/:id/update-role', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const newRole = req.body.role; // 'admin' or 'user'
        if (newRole !== 'admin' && newRole !== 'user') {
            throw new BadRequestError('Invalid role value');
        }

        user.role = newRole;
        await user.save();

        res.send({ message: `User role has been updated to ${newRole}` });
    } catch (error) {
        res.status(500).send(error);
    }
});



module.exports = router;
