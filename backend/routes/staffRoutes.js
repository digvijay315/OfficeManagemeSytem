const express = require('express');
const {
    getTasks, getGroupedTasks, updateTask, createAdditionalTask,
    getFunds,
    getTodayAttendance, startAttendance, stopAttendance
} = require('../controllers/staffController');

const router = express.Router();

router.get('/tasks', getTasks);
router.get('/tasks/grouped', getGroupedTasks);
router.put('/tasks/:id', updateTask);
router.post('/tasks', createAdditionalTask);

router.get('/funds', getFunds);

router.get('/attendance/today', getTodayAttendance);
router.post('/attendance/start', startAttendance);
router.post('/attendance/stop', stopAttendance);

module.exports = router;
