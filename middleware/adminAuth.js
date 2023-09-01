require('dotenv').config({ path: '../config/.env' });
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { UnauthorizedError } = require('../customError');

const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            _id: decoded._id,
            'tokens.token': token,
            role: 'admin' // Check if the user is an admin
        });

        if (!user) {
            throw new UnauthorizedError('Authentication required as admin');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            return res.status(error.statusCode).send({ error: error.message });
        }
        res.status(401).send({ error: 'Authentication required' });
    }
};

module.exports = adminAuth;
