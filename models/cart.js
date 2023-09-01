const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema(
    {
        owner: {
            type: ObjectID,
            required: true,
            ref: 'User',
        },
        items: [
            {
                itemId: {
                    type: ObjectID,
                    ref: 'Item',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
                orderId: {
                    type: ObjectID,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
