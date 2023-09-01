const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            validate: {
                validator: function (value) {
                    return value >= 0; 
                },
                message: "Price must be a non-negative value",
            },
        },
        stockQuantity: {
            type: Number,
            required: true,
            validate: {
                validator: function (value) {
                    return value >= 0; 
                },
                message: "Stock quantity must be a non-negative value",
            },
        },
    },
    {
        timestamps: true,
    }
);

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
