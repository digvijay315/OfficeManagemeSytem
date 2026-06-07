const User = require('../models/User');
const Task = require('../models/Task');
const Fund = require('../models/Fund');
const SalaryPayment = require('../models/SalaryPayment');
const Attendance = require('../models/Attendance');
const PredefinedTask = require('../models/PredefinedTask');
const { staffSchema } = require('../validations/staffValidation');
const mongoose = require('mongoose');
const { getPagination } = require('../utils/pagination');

const getGroupedTasks = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { staff_id, dateFilter } = req.query;

    const matchStage = {};
    if (staff_id) matchStage.staff_id = new mongoose.Types.ObjectId(staff_id);
    
    if (dateFilter) {
        if (dateFilter === 'today') {
            matchStage.date = new Date().toISOString().split('T')[0];
        } else if (dateFilter === 'tomorrow') {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            matchStage.date = d.toISOString().split('T')[0];
        } else if (dateFilter !== 'all') {
            matchStage.date = dateFilter; // custom date
        }
    }

    const pipeline = [
        { $match: matchStage },
        { $sort: { _id: -1 } },
        { 
            $group: { 
                _id: { date: "$date", staff_id: "$staff_id" }, 
                date: { $first: "$date" },
                staff_id: { $first: "$staff_id" },
                tasks: { $push: "$$ROOT" } 
            } 
        },
        { 
            $lookup: { 
                from: 'users', 
                localField: 'staff_id', 
                foreignField: '_id', 
                as: 'staff' 
            } 
        },
        { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
        { $sort: { date: -1 } }
    ];

    const groupedTasks = await Task.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]);
    const totalGroups = await Task.aggregate([...pipeline, { $count: "total" }]);
    const total = totalGroups.length > 0 ? totalGroups[0].total : 0;

    res.json({ data: groupedTasks, total, page, pages: Math.ceil(total / limit) });
};

const getStaff = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const total = await User.countDocuments({ role: 'staff' });
    const staff = await User.find({ role: 'staff' }).skip(skip).limit(limit).sort({ _id: -1 });
    res.json({ data: staff, total, page, pages: Math.ceil(total / limit) });
};

const createStaff = async (req, res) => {
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
};

const updateStaff = async (req, res) => {
    try {
        const staff = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(staff);
    } catch (err) {
        res.status(400).json({ error: 'Error updating staff' });
    }
};

const deleteStaff = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting staff' });
    }
};

const assignTask = async (req, res) => {
    const { staff_id, title, description, date, type } = req.body;
    try {
        const task = await Task.create({ staff_id, title, description, date, type: type || 'regular' });
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: 'Error assigning task' });
    }
};

const recordFund = async (req, res) => {
    const { staff_id, amount, date, description } = req.body;
    try {
        const fund = await Fund.create({ staff_id, amount, date, description });
        res.json(fund);
    } catch (error) {
        res.status(400).json({ error: 'Error recording fund' });
    }
};

const getFundsSummary = async (req, res) => {
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
};

const paySalary = async (req, res) => {
    const { staff_id, month, amount } = req.body;
    const date = new Date().toISOString().split('T')[0];
    try {
        const payment = await SalaryPayment.create({ staff_id, month, amount, date });
        res.json(payment);
    } catch (err) {
        res.status(400).json({ error: 'Error recording salary payment' });
    }
};

const getAttendance = async (req, res) => {
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
};

const getPredefinedTasks = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const total = await PredefinedTask.countDocuments();
    const tasks = await PredefinedTask.find().skip(skip).limit(limit).sort({ _id: -1 });
    res.json({ data: tasks, total, page, pages: Math.ceil(total / limit) });
};

const createPredefinedTask = async (req, res) => {
    try {
        const task = await PredefinedTask.create(req.body);
        res.json(task);
    } catch (e) {
        res.status(400).json({ error: 'Error adding predefined task' });
    }
};

const deletePredefinedTask = async (req, res) => {
    try {
        await PredefinedTask.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: 'Error deleting task' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Stats for top cards
        const staffCount = await User.countDocuments({ role: 'staff' });
        const taskCount = await Task.countDocuments({ date: today });
        const attendanceCount = await Attendance.countDocuments({ date: today });
        const emergencyCount = await Task.countDocuments({ status: 'pending', type: 'additional' });
        
        // For charts: Last 7 days data
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const past7DaysStr = d.toISOString().split('T')[0];

        const attendanceData = await Attendance.aggregate([
            { $match: { date: { $gte: past7DaysStr } } },
            { $group: { _id: "$date", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        const formatAttendanceChart = attendanceData.map(a => ({
            name: a._id.substring(5), // MM-DD
            Attendance: a.count
        }));

        const tasksData = await Task.aggregate([
            { $match: { date: { $gte: past7DaysStr } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        let completed = 0;
        let pending = 0;
        tasksData.forEach(t => {
            if (t._id === 'completed') completed = t.count;
            if (t._id === 'pending') pending = t.count;
        });
        
        const taskCompletionChart = [
            { name: 'Completed', value: completed },
            { name: 'Pending', value: pending }
        ];

        res.json({
            staffCount,
            taskCount,
            attendanceCount,
            emergencyCount,
            charts: {
                attendance: formatAttendanceChart,
                taskCompletion: taskCompletionChart
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
};

module.exports = {
    getStaff, createStaff, updateStaff, deleteStaff,
    assignTask, getGroupedTasks, recordFund, getFundsSummary, paySalary,
    getAttendance, getPredefinedTasks, createPredefinedTask, deletePredefinedTask,
    getDashboardStats
};
