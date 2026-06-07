const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://digvijay:digvijay@cluster0.yisihts.mongodb.net/officeStaffManagement?retryWrites=true&w=majority');
        
        console.log('MongoDB connected successfully');
        
        // Ensure default admin exists
        const adminCheck = await User.findOne({ email: 'admin@gmail.com' });
        if (!adminCheck) {
            await User.create({
                name: 'Admin',
                email: 'admin@gmail.com',
                password: 'admin@123',
                role: 'admin'
            });
            console.log('Default admin created.');
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
