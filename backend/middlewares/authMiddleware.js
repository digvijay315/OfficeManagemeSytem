const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    let token;
    if (req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }
    
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const user = await User.findById(token);
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = authMiddleware;
