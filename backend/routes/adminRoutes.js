const express = require('express');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { addClient } = require('../utils/sse');
const {
    getStaff, createStaff, updateStaff, deleteStaff,
    getSubadmins, createSubadmin, updateSubadmin, deleteSubadmin,
    assignTask, getGroupedTasks, recordFund, getFundsSummary, paySalary,
    getAttendance, getAttendancePDF, getPredefinedTasks, createPredefinedTask, deletePredefinedTask,
    getDashboardStats, getAdvanceRequests, getAdvanceHistory, updateAdvanceRequest,
    verifyTask, getRevenueReports, getPendingVerificationTasks, getStaffReport, updateTask, deleteTask,
    getLeads, createLead, assignLead, updateLead, deleteLead,
    getIncomes, getPendingIncomeCount, createIncome, updateIncome, deleteIncome,
    getExpenses, createExpense, updateExpense, deleteExpense
} = require('../controllers/adminController');

const router = express.Router();

// all admin routes
// Apply adminMiddleware to all routes in this  
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
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

router.post('/funds', recordFund);
router.get('/funds/summary/:month', getFundsSummary);
router.get('/funds/report/:staff_id/:month', getStaffReport);
router.get('/funds/requests', getAdvanceRequests);
router.get('/funds/history', getAdvanceHistory);
router.put('/funds/request/:id', updateAdvanceRequest);

router.get('/revenue-reports', getRevenueReports);

router.post('/pay-salary', paySalary);

router.get('/attendance', getAttendance);
router.get('/attendance/pdf', getAttendancePDF);

router.get('/predefined-tasks', getPredefinedTasks);
router.post('/predefined-tasks', createPredefinedTask);
router.delete('/predefined-tasks/:id', deletePredefinedTask);

router.get('/leads', getLeads);
router.post('/leads', createLead);
router.post('/leads/:id/assign', assignLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);

router.get('/incomes', getIncomes);
router.get('/incomes/pending-count', getPendingIncomeCount);
router.post('/incomes', createIncome);
router.put('/incomes/:id', updateIncome);
router.delete('/incomes/:id', deleteIncome);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

module.exports = router;
