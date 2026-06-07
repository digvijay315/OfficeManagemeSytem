const express = require('express');
const adminMiddleware = require('../middlewares/adminMiddleware');
const {
    getStaff, createStaff, updateStaff, deleteStaff,
    assignTask, getGroupedTasks, recordFund, getFundsSummary, paySalary,
    getAttendance, getPredefinedTasks, createPredefinedTask, deletePredefinedTask,
    getDashboardStats
} = require('../controllers/adminController');

const router = express.Router();

// Apply adminMiddleware to all routes in this file
// Notice: authMiddleware should be applied before this router in server.js
router.use(adminMiddleware);

router.get('/dashboard-stats', getDashboardStats);

router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

router.post('/tasks', assignTask);
router.get('/tasks/grouped', getGroupedTasks);

router.post('/funds', recordFund);
router.get('/funds/summary/:month', getFundsSummary);

router.post('/pay-salary', paySalary);

router.get('/attendance', getAttendance);

router.get('/predefined-tasks', getPredefinedTasks);
router.post('/predefined-tasks', createPredefinedTask);
router.delete('/predefined-tasks/:id', deletePredefinedTask);

module.exports = router;
