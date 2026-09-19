const User = require('../models/User');
const Task = require('../models/Task');
const Fund = require('../models/Fund');
const SalaryPayment = require('../models/SalaryPayment');
const Attendance = require('../models/Attendance');
const PredefinedTask = require('../models/PredefinedTask');
const Lead = require('../models/Lead');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { staffSchema, subadminSchema } = require('../validations/staffValidation');
const mongoose = require('mongoose');
const { getPagination } = require('../utils/pagination');
const PDFDocument = require('pdfkit-table');

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

const getPendingVerificationTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ type: 'additional', verificationStatus: 'pending' })
            .populate('staff_id', 'name email Upload')
            .sort({ date: -1, _id: -1 });
        
        // Transform to add 'staff' property for the frontend
        const transformed = tasks.map(t => ({
            ...t.toObject(),
            staff: t.staff_id
        }));
        res.json({ data: transformed });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching pending tasks' });
    }
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

    const { name, email, password, mobile, salary, dailyWage, Upload, documentName, documentNo, address, bankName, accountNo, ifscCode, branchName, joinedDate } = req.body;
    try {
        const dateToSave = joinedDate || new Date().toISOString().split('T')[0];
        const staff = await User.create({ name, email, password, role: 'staff', mobile, salary: salary || 0, dailyWage: dailyWage || 0, Upload, documentName, documentNo, address, bankName, accountNo, ifscCode, branchName, joinedDate: dateToSave });
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

const getSubadmins = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const total = await User.countDocuments({ role: 'subadmin' });
    const subadmins = await User.find({ role: 'subadmin' }).skip(skip).limit(limit).sort({ _id: -1 });
    res.json({ data: subadmins, total, page, pages: Math.ceil(total / limit) });
};

const createSubadmin = async (req, res) => {
    const { error } = subadminSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, mobile } = req.body;
    try {
        const subadmin = await User.create({ name, email, password, role: 'subadmin', mobile });
        res.json(subadmin);
    } catch (err) {
        res.status(400).json({ error: 'Error creating subadmin (Email might be duplicate)' });
    }
};

const updateSubadmin = async (req, res) => {
    try {
        const subadmin = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(subadmin);
    } catch (err) {
        res.status(400).json({ error: 'Error updating subadmin' });
    }
};

const deleteSubadmin = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting subadmin' });
    }
};

const { sendToUser } = require('../utils/sse');

const assignTask = async (req, res) => {
    const { staff_id, title, description, date, type, customer } = req.body;
    try {
        const task = await Task.create({ staff_id, title, description, date, type: type || 'regular', customer });
        
        sendToUser(staff_id, 'new_task', {
            id: task._id,
            title,
            message: `New task assigned: ${title}`
        });

        res.json(task);
    } catch (error) {
        res.status(400).json({ error: 'Error assigning task' });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndUpdate(id, req.body, { new: true });
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: 'Error updating task' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await Task.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting task' });
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

        const allFunds = await Fund.find({ date: { $regex: `^${month}` }, status: 'approved' });
        const allPayments = await SalaryPayment.find({ month });
        const allAttendances = await Attendance.find({ date: { $regex: `^${month}` } });
        const allRewardTasks = await Task.find({ 
            date: { $regex: `^${month}` }, 
            verificationStatus: 'verified', 
            rewardAmount: { $gt: 0 } 
        });

        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr);
        const monthNum = parseInt(monthStr);
        const daysInMonth = new Date(year, monthNum, 0).getDate();

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDate = today.getDate();

        let daysPassedInMonth = daysInMonth;
        if (year === currentYear && monthNum === currentMonth) {
            daysPassedInMonth = currentDate;
        } else if (year > currentYear || (year === currentYear && monthNum > currentMonth)) {
            daysPassedInMonth = 0;
        }

        const summary = staffMembers.map(staff => {
            const staffFunds = allFunds.filter(f => f.staff_id.toString() === staff.id);
            const totalAdvance = staffFunds.reduce((sum, f) => sum + f.amount, 0);
            
            const staffRewards = allRewardTasks.filter(t => t.staff_id.toString() === staff.id);
            const totalReward = staffRewards.reduce((sum, t) => sum + (t.rewardAmount || 0), 0);

            // Attendance calculation
            const staffAttendances = allAttendances.filter(a => a.staff_id && a.staff_id.toString() === staff.id);
            const uniqueDates = new Set(staffAttendances.map(a => a.date));
            const presentDays = uniqueDates.size;
            
            // Calculate absent days based on days passed in the month, not the total days
            const absentDays = Math.max(0, daysPassedInMonth - presentDays);
            
            console.log(`Staff ${staff.name}: daysPassedInMonth=${daysPassedInMonth}, presentDays=${presentDays}, absentDays=${absentDays}, currentYear=${currentYear}, currentMonth=${currentMonth}, year=${year}, monthNum=${monthNum}, currentDate=${currentDate}`);
            
            const payment = allPayments.find(p => p.staff_id.toString() === staff.id);
            let baseSalary = staff.salary || 0;
            let dailyWage = baseSalary / daysInMonth;
            if (staff.dailyWage && staff.dailyWage > 0) {
                dailyWage = staff.dailyWage;
                baseSalary = dailyWage * daysInMonth;
            }
            
            const deduction = Math.round(absentDays * dailyWage);
            
            const effectiveSalary = baseSalary + totalReward;
            
            return {
                staff_id: staff.id,
                name: staff.name,
                email: staff.email,
                pic: staff.Upload?.pic?.[0] || null,
                baseSalary,
                totalReward,
                totalAdvance,
                presentDays,
                absentDays,
                daysInMonth,
                deduction,
                remainingSalary: Math.max(0, effectiveSalary - totalAdvance - deduction),
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
    const { staff_id, month, amount, slipUrl } = req.body;
    const date = new Date().toISOString().split('T')[0];
    try {
        const payment = await SalaryPayment.create({ staff_id, month, amount, date, slipUrl });
        res.json(payment);
    } catch (err) {
        res.status(400).json({ error: 'Error recording salary payment' });
    }
};

const getAttendance = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { fromDate, toDate, staff_id } = req.query;

    let query = {};
    if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = fromDate;
        if (toDate) query.date.$lte = toDate;
    }
    if (staff_id) {
        query.staff_id = new mongoose.Types.ObjectId(staff_id);
    }

    const total = await Attendance.countDocuments(query);
    const attendances = await Attendance.find(query).populate('staff_id', 'name email Upload').sort({ date: -1 }).skip(skip).limit(limit);
    
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
        start_image_url: a.start_image_url,
        image_url: a.image_url
    }));
    res.json({ data: transformed, total, page, pages: Math.ceil(total / limit) });
};

const getAttendancePDF = async (req, res) => {
    const { fromDate, toDate, staff_id } = req.query;

    try {
        let query = {};
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = fromDate;
            if (toDate) query.date.$lte = toDate;
        }
        if (staff_id) {
            query.staff_id = new mongoose.Types.ObjectId(staff_id);
        }

        const attendances = await Attendance.find(query)
            .populate('staff_id', 'name')
            .sort({ date: -1 });

        let staffQuery = { role: 'staff' };
        if (staff_id) staffQuery._id = new mongoose.Types.ObjectId(staff_id);
        const staffMembers = await User.find(staffQuery);

        let datesToCheck = [];
        if (fromDate && toDate) {
            let start = new Date(fromDate);
            let end = new Date(toDate);
            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                datesToCheck.push(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
            }
        } else if (fromDate) {
            let start = new Date(fromDate);
            let end = new Date();
            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                datesToCheck.push(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
            }
        } else {
            datesToCheck = [...new Set(attendances.map(a => a.date))];
            if (datesToCheck.length === 0) {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                for (let i = 1; i <= today.getDate(); i++) {
                    const d = new Date(year, month, i);
                    datesToCheck.push(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
                }
            }
        }
        datesToCheck.sort((a, b) => new Date(b) - new Date(a));

        const combinedDatas = [];
        datesToCheck.forEach(dateStr => {
            staffMembers.forEach(staff => {
                const record = attendances.find(a => a.date === dateStr && a.staff_id && a.staff_id._id.toString() === staff._id.toString());
                if (record) {
                    let worked = 'N/A';
                    if (record.start_time && record.end_time) {
                        try {
                            const parseTime = (timeStr) => {
                                const parts = timeStr.split(' ');
                                const time = parts[0];
                                const modifier = parts[1];
                                let [hours, minutes, seconds] = time.split(':');
                                if (hours === '12') hours = '00';
                                if (modifier && modifier.toUpperCase() === 'PM') hours = parseInt(hours, 10) + 12;
                                const d = new Date();
                                d.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds || 0, 10), 0);
                                return d;
                            };
                            const start = parseTime(record.start_time);
                            const end = parseTime(record.end_time);
                            let diffMs = end - start;
                            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                            worked = `${Math.floor(diffMs / (1000 * 60 * 60))}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`;
                        } catch (e) {}
                    }
                    combinedDatas.push({
                        date: dateStr,
                        name: staff.name,
                        in: record.start_time || 'N/A',
                        out: record.end_time || 'Working',
                        worked: worked,
                        status: record.end_time ? 'Completed' : 'Active'
                    });
                } else {
                    combinedDatas.push({
                        date: dateStr,
                        name: staff.name,
                        in: '-',
                        out: '-',
                        worked: '-',
                        status: 'Absent'
                    });
                }
            });
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.pdf');

        doc.pipe(res);

        doc.fontSize(16).text('Staff Attendance Report', { align: 'center' });
        doc.moveDown(1);
        if (fromDate || toDate) {
            doc.fontSize(10).text(`Period: ${fromDate || 'Start'} to ${toDate || 'End'}`, { align: 'center' });
            doc.moveDown(1);
        }

        const tableArray = {
            headers: [
                { label: "Date", property: 'date', width: 80 },
                { label: "Staff Name", property: 'name', width: 120 },
                { label: "In Time", property: 'in', width: 70 },
                { label: "Out Time", property: 'out', width: 70 },
                { label: "Worked Hours", property: 'worked', width: 80 },
                { label: "Status", property: 'status', width: 70 }
            ],
            datas: combinedDatas
        };

        await doc.table(tableArray, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                if (row.status === 'Absent') {
                    doc.font("Helvetica").fontSize(9).fillColor('red');
                } else {
                    doc.font("Helvetica").fontSize(9).fillColor('black');
                }
            },
        });

        doc.end();
    } catch (err) {
        console.error('Error generating PDF:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error generating PDF' });
        }
    }
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

const getAdvanceRequests = async (req, res) => {
    try {
        const requests = await Fund.find({ status: 'pending' }).populate('staff_id', 'name email Upload').sort({ _id: -1 });
        const transformed = requests.map(r => ({
            id: r._id,
            staff_id: r.staff_id._id,
            name: r.staff_id.name,
            email: r.staff_id.email,
            pic: r.staff_id?.Upload?.pic?.[0] || null,
            amount: r.amount,
            date: r.date,
            description: r.description
        }));
        res.json(transformed);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching advance requests' });
    }
};

const getAdvanceHistory = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { month, staff_id } = req.query;

    const query = { status: { $ne: 'pending' } }; // fetch approved and rejected
    const salaryQuery = {};
    
    if (month) {
        query.date = { $regex: `^${month}` };
        salaryQuery.month = month;
    }
    if (staff_id) {
        query.staff_id = new mongoose.Types.ObjectId(staff_id);
        salaryQuery.staff_id = new mongoose.Types.ObjectId(staff_id);
    }

    try {
        const funds = await Fund.find(query).populate('staff_id', 'name email Upload').sort({ _id: -1 });
        const salaryPayments = await SalaryPayment.find(salaryQuery).populate('staff_id', 'name email Upload').sort({ _id: -1 });
        
        let combined = [
            ...funds.map(r => ({
                id: r._id,
                name: r.staff_id?.name || 'Unknown',
                email: r.staff_id?.email || '',
                pic: r.staff_id?.Upload?.pic?.[0] || null,
                amount: r.amount,
                date: r.date,
                description: r.description,
                status: r.status,
                slipUrl: r.slipUrl,
                type: 'advance'
            })),
            ...salaryPayments.map(r => ({
                id: r._id,
                name: r.staff_id?.name || 'Unknown',
                email: r.staff_id?.email || '',
                pic: r.staff_id?.Upload?.pic?.[0] || null,
                amount: r.amount,
                date: r.date,
                description: `Final Salary for ${r.month}`,
                status: 'approved',
                slipUrl: r.slipUrl,
                type: 'salary'
            }))
        ];

        // Sort by date descending
        combined.sort((a, b) => new Date(b.date) - new Date(a.date));

        const total = combined.length;
        const paginatedData = combined.slice(skip, skip + limit);

        res.json({ data: paginatedData, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching history' });
    }
};

const updateAdvanceRequest = async (req, res) => {
    const { id } = req.params;
    const { status, slipUrl } = req.body;
    try {
        const fund = await Fund.findByIdAndUpdate(id, { status, slipUrl }, { new: true });
        res.json(fund);
    } catch (err) {
        res.status(500).json({ error: 'Error updating advance request' });
    }
};

const verifyTask = async (req, res) => {
    const { id } = req.params;
    const { verificationStatus, rewardAmount, rewardSlipUrls } = req.body;
    try {
        const task = await Task.findByIdAndUpdate(id, { 
            verificationStatus, 
            rewardAmount: rewardAmount || 0,
            rewardSlipUrls
        }, { new: true });

        if (verificationStatus === 'verified' && rewardAmount > 0) {
            sendToUser(task.staff_id, 'reward_received', {
                taskId: task._id,
                amount: rewardAmount,
                message: `You received a reward of ₹${rewardAmount} for an additional task!`
            });
        }

        res.json(task);
    } catch (err) {
        res.status(500).json({ error: 'Error verifying task' });
    }
};

const getRevenueReports = async (req, res) => {
    const { month } = req.query; // format: 'YYYY-MM', or empty for all
    
    try {
        let taskQuery = {};
        if (month) {
            taskQuery.date = { $regex: `^${month}` };
        }

        const tasks = await Task.find(taskQuery).populate('staff_id', 'name email Upload');
        
        const totalRevenueThisMonth = tasks.reduce((sum, t) => sum + (t.paymentAmount || 0), 0);
        
        const totalRewardsThisMonth = tasks.filter(t => t.verificationStatus === 'verified')
                                           .reduce((sum, t) => sum + (t.rewardAmount || 0), 0);

        // Group by staff
        const staffMap = {};
        tasks.forEach(t => {
            if (!t.staff_id) return;
            const sId = t.staff_id._id.toString();
            if (!staffMap[sId]) {
                staffMap[sId] = {
                    staff_id: t.staff_id._id,
                    name: t.staff_id.name,
                    email: t.staff_id.email,
                    pic: t.staff_id.Upload?.pic?.[0] || null,
                    revenue: 0,
                    rewards: 0
                };
            }
            staffMap[sId].revenue += (t.paymentAmount || 0);
            if (t.verificationStatus === 'verified') {
                staffMap[sId].rewards += (t.rewardAmount || 0);
            }
        });

        // Fetch Income sum
        let incomeQuery = { status: 'success' };
        if (month) incomeQuery.date = { $regex: `^${month}` };
        const incomes = await Income.find(incomeQuery);
        const totalIncomeFromRecords = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);

        // Fetch Expense sum
        let expenseQuery = {};
        if (month) expenseQuery.date = { $regex: `^${month}` };
        const expenses = await Expense.find(expenseQuery);
        const totalExpenseFromRecords = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        res.json({
            totalRevenueThisMonth,
            totalRewardsThisMonth,
            totalIncomeFromRecords,
            totalExpenseFromRecords,
            staffData: Object.values(staffMap).sort((a, b) => b.revenue - a.revenue)
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching revenue reports' });
    }
};

const getStaffReport = async (req, res) => {
    const { staff_id, month } = req.params;
    try {
        const staff = await User.findById(staff_id);
        if (!staff) return res.status(404).json({ error: 'Staff not found' });

        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr);
        const monthNum = parseInt(monthStr);
        const daysInMonth = new Date(year, monthNum, 0).getDate();

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDate = today.getDate();

        let daysPassedInMonth = daysInMonth;
        if (year === currentYear && monthNum === currentMonth) {
            daysPassedInMonth = currentDate;
        } else if (year > currentYear || (year === currentYear && monthNum > currentMonth)) {
            daysPassedInMonth = 0;
        }

        let baseSalary = staff.salary || 0;
        let dailyWage = baseSalary / daysInMonth;
        if (staff.dailyWage && staff.dailyWage > 0) {
            dailyWage = staff.dailyWage;
            baseSalary = dailyWage * daysInMonth;
        }

        const allAttendances = await Attendance.find({ staff_id, date: { $regex: `^${month}` } });
        const presentDates = new Set(allAttendances.map(a => a.date));

        const attendanceList = [];
        let absentDays = 0;
        let presentDays = 0;

        for (let i = 1; i <= daysPassedInMonth; i++) {
            const dateStr = `${yearStr}-${monthStr}-${i.toString().padStart(2, '0')}`;
            if (presentDates.has(dateStr)) {
                presentDays++;
                attendanceList.push({ date: dateStr, status: 'Present', deduction: 0 });
            } else {
                absentDays++;
                attendanceList.push({ date: dateStr, status: 'Absent', deduction: Math.round(dailyWage) });
            }
        }

        const deduction = Math.round(absentDays * dailyWage);

        const allFunds = await Fund.find({ staff_id, date: { $regex: `^${month}` }, status: 'approved' });
        const advancesList = allFunds.map(f => ({ date: f.date, amount: f.amount, description: f.description }));
        const totalAdvance = allFunds.reduce((sum, f) => sum + f.amount, 0);

        const allRewardTasks = await Task.find({ 
            staff_id, 
            date: { $regex: `^${month}` }, 
            verificationStatus: 'verified', 
            rewardAmount: { $gt: 0 } 
        });
        const rewardsList = allRewardTasks.map(t => ({ date: t.date, amount: t.rewardAmount, description: t.title }));
        const totalReward = allRewardTasks.reduce((sum, t) => sum + t.rewardAmount, 0);

        const effectiveSalary = baseSalary + totalReward;
        const remainingSalary = Math.max(0, effectiveSalary - totalAdvance - deduction);

        const tillDateBaseSalary = Math.round(daysPassedInMonth * dailyWage);
        const tillDateRemaining = Math.max(0, tillDateBaseSalary + totalReward - totalAdvance - deduction);

        const payment = await SalaryPayment.findOne({ staff_id, month });

        res.json({
            companyName: 'S. NET Digital Broadband',
            staff: {
                name: staff.name,
                email: staff.email,
                baseSalary,
                dailyWage: Math.round(dailyWage)
            },
            summary: {
                daysInMonth,
                daysPassedInMonth,
                presentDays,
                absentDays,
                totalReward,
                totalAdvance,
                deduction,
                remainingSalary,
                tillDateBaseSalary,
                tillDateRemaining,
                isPaid: !!payment
            },
            attendanceList,
            rewardsList,
            advancesList
        });
    } catch (err) {
        res.status(500).json({ error: 'Error generating report' });
    }
};

const getLeads = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    try {
        const total = await Lead.countDocuments();
        const leads = await Lead.find()
            .populate('assignedTo completedBy', 'name email')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
        res.json({ data: leads, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching leads' });
    }
};

const createLead = async (req, res) => {
    try {
        const lead = await Lead.create(req.body);
        res.json(lead);
    } catch (err) {
        res.status(400).json({ error: 'Error creating lead' });
    }
};

const assignLead = async (req, res) => {
    const { id } = req.params;
    const { staff_id } = req.body;
    try {
        const lead = await Lead.findById(id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        
        const task = await Task.create({ 
            staff_id, 
            title: `${lead.leadType} Lead`, 
            description: lead.description, 
            date: new Date().toISOString().split('T')[0], 
            type: 'lead', 
            customer: {
                name: lead.customerName,
                mobile: lead.customerMobile,
                location: { address: lead.location }
            },
            images: lead.photo ? [lead.photo] : [],
            leadId: lead._id
        });

        lead.status = 'assigned';
        lead.assignedTo = staff_id;
        lead.taskId = task._id;
        await lead.save();

        sendToUser(staff_id, 'new_task', {
            id: task._id,
            title: task.title,
            message: `New lead assigned: ${task.title}`
        });

        res.json(lead);
    } catch (error) {
        res.status(400).json({ error: 'Error assigning lead' });
    }
};

const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(lead);
    } catch (err) {
        res.status(400).json({ error: 'Error updating lead' });
    }
};

const deleteLead = async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting lead' });
    }
};

const getIncomes = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    try {
        const total = await Income.countDocuments();
        const incomes = await Income.find().sort({ _id: -1 }).skip(skip).limit(limit);
        res.json({ data: incomes, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching incomes' });
    }
};

const getPendingIncomeCount = async (req, res) => {
    try {
        const count = await Income.countDocuments({ status: 'pending' });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching pending income count' });
    }
};

const createIncome = async (req, res) => {
    try {
        const income = await Income.create(req.body);
        res.json(income);
    } catch (err) {
        res.status(400).json({ error: 'Error creating income' });
    }
};

const updateIncome = async (req, res) => {
    try {
        const income = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(income);
    } catch (err) {
        res.status(400).json({ error: 'Error updating income' });
    }
};

const deleteIncome = async (req, res) => {
    try {
        await Income.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting income' });
    }
};

const getExpenses = async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    try {
        const total = await Expense.countDocuments();
        const expenses = await Expense.find().populate('staff_id', 'name email').sort({ _id: -1 }).skip(skip).limit(limit);
        res.json({ data: expenses, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching expenses' });
    }
};

const createExpense = async (req, res) => {
    try {
        const expense = await Expense.create(req.body);
        res.json(expense);
    } catch (err) {
        res.status(400).json({ error: 'Error creating expense' });
    }
};

const updateExpense = async (req, res) => {
    try {
        const updateData = { ...req.body };
        // If staff_id is explicitly removed/unset by the frontend payload missing it,
        // we should unset it in the database.
        if (!updateData.staff_id) {
            updateData.$unset = { staff_id: 1 };
        }
        
        const expense = await Expense.findByIdAndUpdate(
            req.params.id, 
            updateData,
            { new: true }
        );
        res.json(expense);
    } catch (err) {
        res.status(400).json({ error: 'Error updating expense' });
    }
};

const deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting expense' });
    }
};

module.exports = {
    getStaff, createStaff, updateStaff, deleteStaff,
    getSubadmins, createSubadmin, updateSubadmin, deleteSubadmin,
    assignTask, getGroupedTasks, recordFund, getFundsSummary, paySalary,
    getAttendance, getAttendancePDF, getPredefinedTasks, createPredefinedTask, deletePredefinedTask,
    getDashboardStats, getAdvanceRequests, getAdvanceHistory, updateAdvanceRequest,
    verifyTask, getRevenueReports, getPendingVerificationTasks, getStaffReport, updateTask, deleteTask,
    getLeads, createLead, assignLead, updateLead, deleteLead,
    getIncomes, getPendingIncomeCount, createIncome, updateIncome, deleteIncome,
    getExpenses, createExpense, updateExpense, deleteExpense
};
