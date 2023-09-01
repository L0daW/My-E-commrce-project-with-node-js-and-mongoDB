require('dotenv').config({ path: '../config/.env' });
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { UnauthorizedError } = require('../customError');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        if (!user) {
            throw new UnauthorizedError('Authentication failed: Invalid token');
        }
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: "Authentication required" });
    }
};

module.exports = auth;
