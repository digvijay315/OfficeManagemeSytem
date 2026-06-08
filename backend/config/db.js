const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://snetdumka_db_user:wLRPzpTnq0iHZn8v@cluster0.lw6gxqv.mongodb.net/officeStaffManagement?retryWrites=true&w=majority');

        // await mongoose.connect('mongodb://localhost:27017/officeStaffManagement');
        
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
