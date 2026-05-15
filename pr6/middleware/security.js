const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Забагато запитів, спробуйте пізніше.'
});

function verifyWebhookSignature(req, res, next) {
    const signature = req.headers['x-hub-signature'];
    if (!signature) {
        return res.status(401).json({ error: 'Відсутній підпис HMAC' });
    }

    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
    const expectedSignature = `sha256=${hmac.update(payload).digest('hex')}`;

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return next();
    }
    return res.status(401).json({ error: 'Недійсний підпис HMAC' });
}

module.exports = { apiLimiter, verifyWebhookSignature };
