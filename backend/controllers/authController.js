const User = require('../models/User');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ 
            $or: [{ email }, { mobile: email }], 
            password 
        });
        if (user) {
            res.json({ token: user.id.toString(), user: { id: user.id, name: user.name, role: user.role, Upload: user.Upload } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { login };
