function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Необхідна автентифікація' });
}

function hasRole(...roles) {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Необхідна автентифікація' });
        }
        if (roles.includes(req.user.role)) {
            return next();
        }
        res.status(403).json({ error: 'Недостатньо прав доступу' });
    };
}

module.exports = { isAuthenticated, hasRole };
