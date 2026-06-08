const express = require('express');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { addClient } = require('../utils/sse');
const {
    getStaff, createStaff, updateStaff, deleteStaff,
    getSubadmins, createSubadmin, updateSubadmin, deleteSubadmin,
    assignTask, getGroupedTasks, recordFund, getFundsSummary, paySalary,
    getAttendance, getPredefinedTasks, createPredefinedTask, deletePredefinedTask,
    getDashboardStats, getAdvanceRequests, getAdvanceHistory, updateAdvanceRequest,
    verifyTask, getRevenueReports, getPendingVerificationTasks
} = require('../controllers/adminController');

const router = express.Router();

// Apply adminMiddleware to all routes in this file
// Notice: authMiddleware should be applied before this router in server.js
router.use(adminMiddleware);

router.get('/notifications/stream', addClient);

router.get('/dashboard-stats', getDashboardStats);

router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

router.get('/subadmins', getSubadmins);
router.post('/subadmins', createSubadmin);
router.put('/subadmins/:id', updateSubadmin);
router.delete('/subadmins/:id', deleteSubadmin);

router.get('/tasks/pending-verification', getPendingVerificationTasks);
router.post('/tasks', assignTask);
router.get('/tasks/grouped', getGroupedTasks);
router.put('/tasks/:id/verify', verifyTask);

router.post('/funds', recordFund);
router.get('/funds/summary/:month', getFundsSummary);
router.get('/funds/requests', getAdvanceRequests);
router.get('/funds/history', getAdvanceHistory);
router.put('/funds/request/:id', updateAdvanceRequest);

router.get('/revenue-reports', getRevenueReports);

router.post('/pay-salary', paySalary);

router.get('/attendance', getAttendance);

router.get('/predefined-tasks', getPredefinedTasks);
router.post('/predefined-tasks', createPredefinedTask);
router.delete('/predefined-tasks/:id', deletePredefinedTask);

module.exports = router;
