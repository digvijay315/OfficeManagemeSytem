const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const Joi = require('joi');
const { connectDB, User, Task, Attendance, Fund, PredefinedTask, SalaryPayment } = require('./database');
const { uploadToCloudinary } = require('./controllers/uploadController');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ dest: 'uploads/' });

// Connect to MongoDB
connectDB();

// Simple Auth Middleware
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1]; // token is just user ID for now
    try {
        const user = await User.findById(token);
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin Middleware
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
};

const getPagination = (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

// Upload Route
app.post('/api/upload/upload-files', authMiddleware, upload.array('files'), uploadToCloudinary);

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            res.json({ token: user.id.toString(), user: { id: user.id, name: user.name, role: user.role } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/staff', authMiddleware, adminMiddleware, async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const total = await User.countDocuments({ role: 'staff' });
    const staff = await User.find({ role: 'staff' }).skip(skip).limit(limit).sort({ _id: -1 });
    res.json({ data: staff, total, page, pages: Math.ceil(total / limit) });
});

const staffSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    salary: Joi.number().optional(),
    Upload: Joi.object({
        pic: Joi.array().items(Joi.string()),
        document: Joi.array().items(Joi.string())
    }).optional(),
    documentName: Joi.string().optional().allow(''),
    documentNo: Joi.string().optional().allow(''),
    address: Joi.string().optional().allow(''),
    bankName: Joi.string().optional().allow(''),
    accountNo: Joi.string().optional().allow(''),
    ifscCode: Joi.string().optional().allow(''),
    branchName: Joi.string().optional().allow(''),
    joinedDate: Joi.string().optional().allow('')
});

app.post('/api/admin/staff', authMiddleware, adminMiddleware, async (req, res) => {
    const { error } = staffSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, salary, Upload, documentName, documentNo, address, bankName, accountNo, ifscCode, branchName, joinedDate } = req.body;
    try {
        const dateToSave = joinedDate || new Date().toISOString().split('T')[0];
        const staff = await User.create({ name, email, password, role: 'staff', salary: salary || 0, Upload, documentName, documentNo, address, bankName, accountNo, ifscCode, branchName, joinedDate: dateToSave });
        res.json(staff);
    } catch (err) {
        res.status(400).json({ error: 'Error creating staff (Email might be duplicate)' });
    }
});

app.put('/api/admin/staff/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const staff = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(staff);
    } catch (err) {
        res.status(400).json({ error: 'Error updating staff' });
    }
});

app.delete('/api/admin/staff/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting staff' });
    }
});

app.post('/api/admin/tasks', authMiddleware, adminMiddleware, async (req, res) => {
    const { staff_id, title, description, date, type } = req.body;
    try {
        const task = await Task.create({ staff_id, title, description, date, type: type || 'regular' });
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: 'Error assigning task' });
    }
});

app.post('/api/admin/funds', authMiddleware, adminMiddleware, async (req, res) => {
    const { staff_id, amount, date, description } = req.body;
    try {
        const fund = await Fund.create({ staff_id, amount, date, description });
        res.json(fund);
    } catch (error) {
        res.status(400).json({ error: 'Error recording fund' });
    }
});

app.get('/api/admin/funds/summary/:month', authMiddleware, adminMiddleware, async (req, res) => {
    const { month } = req.params; // format: 'YYYY-MM'
    try {
        let staffMembers = await User.find({ role: 'staff' });
        
        // Filter out staff who joined after the selected month
        staffMembers = staffMembers.filter(staff => {
            if (!staff.joinedDate) return true; // if no joined date, assume old staff
            const joinedMonth = staff.joinedDate.substring(0, 7);
            return joinedMonth <= month;
        });

        const allFunds = await Fund.find({ date: { $regex: `^${month}` } });
        const allPayments = await SalaryPayment.find({ month });

        const summary = staffMembers.map(staff => {
            const staffFunds = allFunds.filter(f => f.staff_id.toString() === staff.id);
            const totalAdvance = staffFunds.reduce((sum, f) => sum + f.amount, 0);
            const payment = allPayments.find(p => p.staff_id.toString() === staff.id);
            const baseSalary = staff.salary || 0;
            
            return {
                staff_id: staff.id,
                name: staff.name,
                email: staff.email,
                pic: staff.Upload?.pic?.[0] || null,
                baseSalary,
                totalAdvance,
                remainingSalary: baseSalary - totalAdvance,
                isPaid: !!payment,
                paymentDetails: payment || null
            };
        });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching summary' });
    }
});

app.post('/api/admin/pay-salary', authMiddleware, adminMiddleware, async (req, res) => {
    const { staff_id, month, amount } = req.body;
    const date = new Date().toISOString().split('T')[0];
    try {
        const payment = await SalaryPayment.create({ staff_id, month, amount, date });
        res.json(payment);
    } catch (err) {
        res.status(400).json({ error: 'Error recording salary payment' });
    }
});

app.get('/api/admin/attendance', authMiddleware, adminMiddleware, async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const total = await Attendance.countDocuments();
    const attendances = await Attendance.find().populate('staff_id', 'name email Upload').sort({ date: -1 }).skip(skip).limit(limit);
    
    // Transform to match previous structure where staff_name is top level
    const transformed = attendances.map(a => ({
        id: a._id,
        date: a.date,
        staff_name: a.staff_id ? a.staff_id.name : 'Unknown',
        staff_email: a.staff_id ? a.staff_id.email : '',
        staff_pic: a.staff_id?.Upload?.pic?.[0] || null,
        start_time: a.start_time,
        end_time: a.end_time,
        start_location: a.start_location,
        end_location: a.end_location,
        image_url: a.image_url
    }));
    res.json({ data: transformed, total, page, pages: Math.ceil(total / limit) });
});

app.get('/api/admin/predefined-tasks', authMiddleware, adminMiddleware, async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const total = await PredefinedTask.countDocuments();
    const tasks = await PredefinedTask.find().skip(skip).limit(limit).sort({ _id: -1 });
    res.json({ data: tasks, total, page, pages: Math.ceil(total / limit) });
});

app.post('/api/admin/predefined-tasks', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const task = await PredefinedTask.create(req.body);
        res.json(task);
    } catch (e) {
        res.status(400).json({ error: 'Error adding predefined task' });
    }
});

app.delete('/api/admin/predefined-tasks/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await PredefinedTask.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: 'Error deleting task' });
    }
});

// --- STAFF ROUTES ---
app.get('/api/staff/tasks', authMiddleware, async (req, res) => {
    const tasks = await Task.find({ staff_id: req.user._id }).sort({ date: -1 });
    res.json(tasks);
});

app.put('/api/staff/tasks/:id', authMiddleware, async (req, res) => {
    const { status, comment } = req.body;
    await Task.findOneAndUpdate({ _id: req.params.id, staff_id: req.user._id }, { status, comment });
    res.json({ success: true });
});

// Adding self-assigned additional tasks
app.post('/api/staff/tasks', authMiddleware, async (req, res) => {
    const { title, description, date, type } = req.body;
    const task = await Task.create({ 
        staff_id: req.user._id, 
        title, 
        description, 
        date, 
        type: type || 'additional', 
        status: 'completed' 
    });
    res.json(task);
});

app.get('/api/staff/funds', authMiddleware, async (req, res) => {
    const funds = await Fund.find({ staff_id: req.user._id }).sort({ date: -1 });
    const totalTaken = funds.reduce((sum, f) => sum + f.amount, 0);
    const salary = req.user.salary;
    const remaining = salary - totalTaken;
    res.json({ salary, totalTaken, remaining, funds });
});

app.get('/api/staff/attendance/today', authMiddleware, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ staff_id: req.user._id, date: today });
    res.json(attendance || null);
});

app.post('/api/staff/attendance/start', authMiddleware, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { start_time, start_location } = req.body;
    
    const existing = await Attendance.findOne({ staff_id: req.user._id, date: today });
    if (existing) return res.status(400).json({ error: 'Attendance already started today' });

    const attendance = await Attendance.create({
        staff_id: req.user._id, date: today, start_time, start_location
    });
    res.json(attendance);
});

app.post('/api/staff/attendance/stop', authMiddleware, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { end_time, end_location, image_url } = req.body;
    
    await Attendance.findOneAndUpdate(
        { staff_id: req.user._id, date: today },
        { end_time, end_location, image_url }
    );
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
