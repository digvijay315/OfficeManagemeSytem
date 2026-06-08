const express = require('express');
const {
    getTasks, getGroupedTasks, updateTask, createAdditionalTask,
    getFunds, requestAdvance,
    getTodayAttendance, startAttendance, stopAttendance,
    getRewardsAndRevenue, getProfile, updateProfile, changePassword,
    updateRewardCount
} = require('../controllers/staffController');

const router = express.Router();

const { addClient } = require('../utils/sse');
router.get('/notifications/stream', addClient);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.put('/update-reward-count', updateRewardCount);

router.get('/tasks', getTasks);
router.get('/tasks/grouped', getGroupedTasks);
router.put('/tasks/:id', updateTask);
router.post('/tasks', createAdditionalTask);

router.get('/funds', getFunds);
router.post('/funds/request', requestAdvance);

router.get('/rewards-revenue', getRewardsAndRevenue);

router.get('/attendance/today', getTodayAttendance);
router.post('/attendance/start', startAttendance);
router.post('/attendance/stop', stopAttendance);

module.exports = router;
