const Task = require('../models/Task');
const Fund = require('../models/Fund');
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
    const { status, comment } = req.body;
    await Task.findOneAndUpdate({ _id: req.params.id, staff_id: req.user._id }, { status, comment });
    res.json({ success: true });
};

const createAdditionalTask = async (req, res) => {
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
};

const getFunds = async (req, res) => {
    const funds = await Fund.find({ staff_id: req.user._id }).sort({ date: -1 });
    const totalTaken = funds.reduce((sum, f) => sum + f.amount, 0);
    const salary = req.user.salary;
    const remaining = salary - totalTaken;
    res.json({ salary, totalTaken, remaining, funds });
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

module.exports = {
    getTasks, getGroupedTasks, updateTask, createAdditionalTask,
    getFunds,
    getTodayAttendance, startAttendance, stopAttendance
};
