const Task = require('../models/Task');
const Fund = require('../models/Fund');
const SalaryPayment = require('../models/SalaryPayment');
const Attendance = require('../models/Attendance');

const mongoose = require('mongoose');
const { getPagination } = require('../utils/pagination');

const getTasks = async (req, res) => {
    const tasks = await Task.find({ staff_id: req.user._id }).sort({ date: -1 });
    res.json(tasks);
};

const getGroupedTasks = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    
    const pipeline = [
        { $match: { staff_id: new mongoose.Types.ObjectId(req.user._id) } },
        { $sort: { _id: -1 } },
        { $group: { _id: "$date", date: { $first: "$date" }, tasks: { $push: "$$ROOT" } } },
        { $sort: { date: -1 } }
    ];

    const groupedTasks = await Task.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]);
    const totalGroups = await Task.aggregate([...pipeline, { $count: "total" }]);
    const total = totalGroups.length > 0 ? totalGroups[0].total : 0;

    res.json({ data: groupedTasks, total, page, pages: Math.ceil(total / limit) });
};

const updateTask = async (req, res) => {
    const { status, comment, images, paymentAmount, paymentMode, paymentSlipUrls } = req.body;
    await Task.findOneAndUpdate({ _id: req.params.id, staff_id: req.user._id }, { 
        status, 
        comment, 
        images,
        paymentAmount: paymentAmount || 0,
        paymentMode: paymentMode || 'none',
        paymentSlipUrls
    });
    res.json({ success: true });
};

const createAdditionalTask = async (req, res) => {
    const { title, description, date, type, images } = req.body;
    const task = await Task.create({ 
        staff_id: req.user._id, 
        title, 
        description, 
        date, 
        type: type || 'additional', 
        status: 'completed',
        images: images || [],
        verificationStatus: 'pending'
    });
    res.json(task);
};

const getFunds = async (req, res) => {
    const { month } = req.query;
    
    let query = { staff_id: req.user._id };
    if (month) {
        query.date = { $regex: `^${month}` };
    }

    const funds = await Fund.find(query).sort({ date: -1 });
    
    let salaryQuery = { staff_id: req.user._id };
    if (month) {
        salaryQuery.month = month;
    }
    const salaryPayments = await SalaryPayment.find(salaryQuery).sort({ date: -1 });

    const rewardsQuery = { 
        staff_id: req.user._id, 
        verificationStatus: 'verified', 
        rewardAmount: { $gt: 0 } 
    };
    if (month) {
        rewardsQuery.date = { $regex: `^${month}` };
    }

    const rewardTasks = await Task.find(rewardsQuery);
    const totalRewards = rewardTasks.reduce((sum, t) => sum + (t.rewardAmount || 0), 0);

    const combined = [
        ...funds.map(f => ({ ...f.toObject(), type: 'advance' })),
        ...salaryPayments.map(s => ({ ...s.toObject(), type: 'salary', description: `Final Salary for ${s.month}`, status: 'approved' })),
        ...rewardTasks.map(t => ({
            id: t._id,
            date: t.date,
            type: 'reward',
            description: `Reward for: ${t.title}`,
            status: 'approved',
            amount: t.rewardAmount
        }))
    ];
    
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    const approvedFunds = combined.filter(f => f.type === 'advance' && f.status === 'approved');
    const totalTaken = approvedFunds.reduce((sum, f) => sum + f.amount, 0);

    const baseSalary = req.user.salary || 0;
    const salary = baseSalary + totalRewards;
    const remaining = salary - totalTaken;

    res.json({ salary, baseSalary, totalRewards, totalTaken, remaining, funds: combined });
};

const getTodayAttendance = async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ staff_id: req.user._id, date: today });
    res.json(attendance || null);
};

const startAttendance = async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { start_time, start_location } = req.body;
    
    const existing = await Attendance.findOne({ staff_id: req.user._id, date: today });
    if (existing) return res.status(400).json({ error: 'Attendance already started today' });

    const attendance = await Attendance.create({
        staff_id: req.user._id, date: today, start_time, start_location
    });
    res.json(attendance);
};

const stopAttendance = async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { end_time, end_location, image_url } = req.body;
    
    await Attendance.findOneAndUpdate(
        { staff_id: req.user._id, date: today },
        { end_time, end_location, image_url }
    );
    res.json({ success: true });
};

const requestAdvance = async (req, res) => {
    const { amount, description, date } = req.body;
    try {
        const fund = await Fund.create({
            staff_id: req.user._id,
            amount,
            description,
            date,
            status: 'pending'
        });
        res.json(fund);
    } catch (err) {
        res.status(500).json({ error: 'Error requesting advance' });
    }
};

const getRewardsAndRevenue = async (req, res) => {
    const { month } = req.query; // format: 'YYYY-MM'
    
    let query = { staff_id: req.user._id };
    if (month) {
        query.date = { $regex: `^${month}` };
    }

    try {
        const tasks = await Task.find(query).sort({ date: -1 });
        
        // Filter tasks that generated revenue
        const revenueTasks = tasks.filter(t => t.paymentAmount > 0);
        const totalRevenue = revenueTasks.reduce((sum, t) => sum + t.paymentAmount, 0);
        
        // Filter verified additional tasks that might have rewards
        const rewardTasks = tasks.filter(t => t.type === 'additional' && t.verificationStatus === 'verified');
        const totalRewards = rewardTasks.reduce((sum, t) => sum + (t.rewardAmount || 0), 0);

        res.json({
            totalRevenue,
            totalRewards,
            revenueTasks,
            rewardTasks
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching rewards and revenue' });
    }
};

module.exports = {
    getTasks, getGroupedTasks, updateTask, createAdditionalTask,
    getFunds, requestAdvance,
    getTodayAttendance, startAttendance, stopAttendance,
    getRewardsAndRevenue
};
