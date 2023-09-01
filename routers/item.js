const express = require('express');
const Item = require('../models/item');
const { NotFoundError } = require('../customError');

const router = new express.Router();

// Error handler function
const errorHandler = (res, error) => {
    console.error(error);
    res.status(500).send({ error: 'An error occurred' });
};

// Fetch all items
router.get('/items', async (req, res) => {
    try {
        const items = await Item.find({}).select('name description price stockQuantity');
        res.status(200).send({ items });
    } catch (error) {
        errorHandler(res, error);
    }
});

// Fetch an item by ID
router.get('/items/:id', async (req, res) => {
    try {
        let item;

        try {
            item = await Item.findById(req.params.id).select('name description price stockQuantity');
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(404).send({ message: 'Item not found' });
            }
            throw error;
        }

        if (!item) {
            return res.status(404).send({ message: 'Item not found' });
        }

        res.status(200).send({ item });
    } catch (error) {
        errorHandler(res, error);
    }
});


module.exports = router;


