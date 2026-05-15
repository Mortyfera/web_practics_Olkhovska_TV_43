const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

router.post('/register',
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty().trim().escape(),
    body('role').isIn(['solar_engineer', 'wind_engineer', 'coordinator']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { email, password, name, role } = req.body;
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ error: 'Користувач вже існує' });

            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
            const user = await User.create({ email, password: hashedPassword, name, role });

            res.status(201).json({ message: 'Реєстрація успішна', user: { id: user.id, email: user.email, role: user.role } });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Вхід успішний', user: { id: req.user.id, role: req.user.role } });
});

router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ 
            authenticated: true, 
            user: { name: req.user.name, role: req.user.role } 
        });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Вихід успішний' });
    });
});

module.exports = router;
