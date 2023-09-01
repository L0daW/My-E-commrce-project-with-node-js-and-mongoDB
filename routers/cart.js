const express = require('express');
const Cart = require('../models/cart');
const Item = require('../models/item');
const Auth = require('../middleware/auth');
const BoughtItem = require('../models/boughtItem'); 
const mongoose = require('mongoose');

const router = new express.Router();

// Order an item and add it to the user's cart
router.post('/items/:itemId/order', Auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const itemId = req.params.itemId;

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }

        // Check if the item is in stock
        if (item.stockQuantity <= 0) {
            return res.status(400).send({ error: 'Item is out of stock' });
        }

        const cart = await findOrCreateUserCart(userId);
        await addItemToCart(cart, itemId);

        res.status(201).send({ message: 'Item ordered and added to the cart' });
    } catch (error) {
        res.status(500).send(error.message); 
    }
});


// Create or update a user's cart
router.post('/cart', Auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await findOrCreateUserCart(userId);
        await addItemsToCart(cart, req.body.items);

        res.status(201).send(cart);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Fetch a user's cart
router.get('/cart', Auth, async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const cart = await findUserCart(userId);
        if (!cart) {
            return res.status(404).send({ error: 'Cart not found' });
        }

        const formattedCart = formatCart(cart, req.user);
        res.status(200).send({ cart: formattedCart });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Delete an order from the cart
router.delete('/cart/orders/:orderId', Auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;
        const cart = await findUserCart(userId);
        if (!cart) {
            return res.status(404).send({ error: 'Cart not found' });
        }

        await removeQuantityFromCart(cart, orderId);
        res.status(200).send({ message: 'Quantity of item removed from the cart' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Verify an order in the user's cart
router.patch('/cart/verify', Auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await findUserCart(userId);
        if (!cart) {
            return res.status(404).send({ error: 'Cart not found' });
        }
        const orderId = await verifyOrder(cart, userId); // Get the ID of the created bought item

        if (orderId) {
            res.send({
                message: 'Order verified',
                orderId, // Return the orderId
                note: 'You can use this ID to cancel the order anytime!',
            });
        } else {
            res.status(500).send({ error: 'Failed to verify order' });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Cancel an order in the user's cart
router.patch('/cart/cancel/:orderId', Auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;

        // Find the bought item using orderId
        const boughtItem = await BoughtItem.findOne({ userId, orderId });

        // Check if the item exists and belongs to the user
        if (!boughtItem) {
            return res.status(404).send({ error: 'Order not found in the cart' });
        }

        // Update the status to 'cancelled'
        boughtItem.status = 'cancelled';
        await boughtItem.save();

        // Restore the item quantities
        for (const itemEntry of boughtItem.items) {
            const item = await Item.findById(itemEntry.itemId);

            if (!item) {
                return res.status(404).send({ error: 'Item not found' });
            }

            item.stockQuantity += itemEntry.quantity; // Add back the previously reserved quantity
            await item.save();
        }

        res.status(200).send({ message: 'Order cancelled' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});



async function findOrCreateUserCart(userId) {
    let cart = await Cart.findOne({ owner: userId });
    if (!cart) {
        cart = new Cart({ owner: userId, items: [] });
        await cart.save();
    }
    return cart;
}

async function addItemToCart(cart, itemId) {
    const existingItem = cart.items.find(item => item.itemId.toString() === itemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.items.push({ itemId, quantity: 1, orderId: new mongoose.Types.ObjectId() });
    }
    await cart.save();
}

async function addItemsToCart(cart, items) {
    for (const { itemId, quantity } of items) {
        const existingItem = cart.items.find(item => item.itemId.toString() === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ itemId, quantity, orderId: new mongoose.Types.ObjectId() });
        }
    }
    await cart.save();
}

async function findUserCart(userId) {
    return await Cart.findOne({ owner: userId }).populate('items.itemId');
}

async function removeQuantityFromCart(cart, orderId) {
    const orderIndex = cart.items.findIndex(item => item.orderId.toString() === orderId);
    if (orderIndex !== -1) {
        if (cart.items[orderIndex].quantity > 1) {
            cart.items[orderIndex].quantity--;
        } else {
            cart.items.splice(orderIndex, 1);
        }
        await cart.save();
    }
}

async function verifyOrder(cart, userId) {
    const boughtItems = [];

    for (const item of cart.items) {
        const itemDetails = await Item.findById(item.itemId);
        if (itemDetails) {
            const newStockQuantity = itemDetails.stockQuantity - item.quantity;
            await Item.findByIdAndUpdate(itemDetails._id, { stockQuantity: newStockQuantity });

            // Create an item entry for the bought items
            const boughtItemEntry = {
                itemId: item.itemId,
                quantity: item.quantity,
                totalPrice: itemDetails.price * item.quantity,
            };

            boughtItems.push(boughtItemEntry);
        }
    }

    // Create a single bought item entry for the entire cart
    const orderId = cart.items[0].orderId; // Assuming the orderId is the same for all items in the cart
    const boughtItem = new BoughtItem({
        userId,
        orderId, // Use the existing order ID
        items: boughtItems, // Add the array of item entries
        status: 'bought',
    });

    // Save the bought item
    await boughtItem.save();

    // Clear the cart by removing all items
    cart.items = [];
    await cart.save();

    return orderId; // Return the orderId of the created bought item
}




function formatCart(cart, user) {
    const formattedItems = cart.items.map(item => ({
        orderId: item.orderId,
        itemName: item.itemId.name,
        itemPrice: item.itemId.price,
        quantity: item.quantity,
    }));

    const totalBill = formattedItems.reduce((total, item) => total + item.itemPrice * item.quantity, 0);

    return {
        user: {
            firstName: user.firstName,
            lastName: user.lastName,
            address: user.address,
        },
        items: formattedItems,
        totalBill: totalBill,
    };
}

module.exports = router;
