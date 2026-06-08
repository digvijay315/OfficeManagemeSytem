const adminMiddleware = (req, res, next) => {
    if (!['admin', 'subadmin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
};

module.exports = adminMiddleware;
