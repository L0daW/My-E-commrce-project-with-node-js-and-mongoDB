const express = require('express');
const { body, validationResult } = require('express-validator');
const passwordComplexity = require('joi-password-complexity');
const User = require('../models/user');
const Auth = require('../middleware/auth');
const { BadRequestError } = require('../customError');

const router = new express.Router();

// Define the password complexity options
const complexityOptions = {
    min: 7, // Minimum length
    max: 26, // Maximum length
    lowerCase: 1, // Require at least one lowercase letter
    upperCase: 1, // Require at least one uppercase letter
    numeric: 1, // Require at least one numeric digit
    symbol: 1, // Require at least one special character
    requirementCount: 4, // Total requirements to meet
};

// Signup
router.post('/users', [
    body('firstName').trim().isLength({ min: 3 }).withMessage('First name must be at least 3 characters'),
    body('lastName').trim().isLength({ min: 3 }).withMessage('Last name must be at least 3 characters'),
    body('username').trim().notEmpty().isLength({ min: 3 }).custom(async (value) => {
        const existingUser = await User.findOne({ username: value });
        if (existingUser) {
            throw new Error('Username already exists');
        }
    }),
    body('email').trim().isEmail().withMessage('Invalid email format'),
    body('password').custom(value => {
        // Validate password using password complexity options
        const validationResult = passwordComplexity(complexityOptions).validate(value);
        if (validationResult.error) {
            throw new Error(validationResult.error.message);
        }
        return true;
    }),
    body('phoneNumber').matches(/^01[0125][0-9]{8}$/).withMessage('Invalid phone number'),
    body('address').notEmpty().withMessage('Address is required')
],
    body('role').custom((value, { req }) => {
        if (value && value !== 'user') {
            throw new Error('Invalid role value.');
        }
        return true;
    }), async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = new User({ ...req.body, role: 'user' });

        try {
            await user.save();
            const token = await user.generateAuthToken();
            res.status(201).send({ user, token });
        } catch (error) {
            res.status(400).send(error);
        }
    });

// Login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        if (user instanceof BadRequestError) {
            res.status(user.statusCode).send({ error: user.message });
        } else {
            const token = await user.generateAuthToken();
            res.send({ user, token });
        }
    } catch (error) {
        res.status(500).send({ error: 'An error occurred' });
    }
});



// Logout
router.post('/users/logout', Auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
        await req.user.save();
        res.send('logout done !');
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;
