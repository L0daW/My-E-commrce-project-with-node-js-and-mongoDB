const mongoose = require('mongoose');

const boughtItemSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        items: [
            {
                itemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                totalPrice: {
                    type: Number,
                    required: true,
                },
            },
        ],
        status: {
            type: String, 
            default: 'bought',
        },
    },
    {
        timestamps: true,
    }
);

const BoughtItem = mongoose.model('BoughtItem', boughtItemSchema);

module.exports = BoughtItem;
