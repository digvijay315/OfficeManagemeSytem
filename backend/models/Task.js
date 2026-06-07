const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    description: String,
    date: String,
    status: { type: String, default: 'pending' },
    type: { type: String, default: 'regular' },
    comment: String,
    images: [String]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
