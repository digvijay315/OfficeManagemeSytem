const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: String,
    start_time: String,
    end_time: String,
    start_location: String,
    end_location: String,
    start_image_url: String,
    image_url: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
