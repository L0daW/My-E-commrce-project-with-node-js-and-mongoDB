require('dotenv').config({ path: '../config/.env' });
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true, 
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
    console.error('Error connecting to MongoDB:', error.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});

module.exports = mongoose;