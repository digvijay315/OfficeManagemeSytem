const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/officeStaffManagement');
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

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'staff' },
    salary: { type: Number, default: 0 },
    Upload: {
        pic: [String],
        document: [String]
    },
    documentName: String,
    documentNo: String,
    address: String,
    bankName: String,
    accountNo: String,
    ifscCode: String,
    branchName: String,
    joinedDate: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const taskSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    description: String,
    date: String,
    status: { type: String, default: 'pending' },
    type: { type: String, default: 'regular' },
    comment: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const attendanceSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: String,
    start_time: String,
    end_time: String,
    start_location: String,
    end_location: String,
    image_url: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const fundSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    date: String,
    description: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const predefinedTaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String
});

const salaryPaymentSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    month: { type: String, required: true }, // Format: "YYYY-MM"
    amount: Number,
    date: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Fund = mongoose.model('Fund', fundSchema);
const PredefinedTask = mongoose.model('PredefinedTask', predefinedTaskSchema);
const SalaryPayment = mongoose.model('SalaryPayment', salaryPaymentSchema);

module.exports = { connectDB, User, Task, Attendance, Fund, PredefinedTask, SalaryPayment };
