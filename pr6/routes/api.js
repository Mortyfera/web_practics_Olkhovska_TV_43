const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const { apiLimiter, verifyWebhookSignature } = require('../middleware/security');

router.use(apiLimiter);

router.get('/v1/solar/generation', isAuthenticated, hasRole('solar_engineer', 'coordinator'), (req, res) => {
    res.json({ data: 'Дані генерації сонячної енергії: 150 MW' });
});

router.get('/v1/wind/generation', isAuthenticated, hasRole('wind_engineer', 'coordinator'), (req, res) => {
    res.json({ data: 'Дані генерації вітрової енергії: 80 MW' });
});

router.post('/v1/balance/adjust', isAuthenticated, hasRole('coordinator'), (req, res) => {
    res.json({ message: 'Баланс загальної генерації успішно відкориговано' });
});

router.post('/webhooks/register', isAuthenticated, verifyWebhookSignature, (req, res) => {
    res.json({ message: 'Вебхук безпечно зареєстровано' });
});

module.exports = router;
