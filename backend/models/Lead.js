const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    leadType: { 
        type: String, 
        enum: ['Services', 'Sale', 'Internet connection', 'Fiber work'],
        required: true
    },
    location: { type: String, required: true },
    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true },
    photo: { type: String },
    description: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'assigned', 'completed'], 
        default: 'pending' 
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
