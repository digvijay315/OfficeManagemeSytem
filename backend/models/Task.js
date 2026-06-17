const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    description: String,
    date: String,
    status: { type: String, default: 'pending' },
    type: { type: String, default: 'regular' },
    comment: String,
    images: [String],
    paymentAmount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['cash', 'online', 'none'], default: 'none' },
    paymentSlipUrls: [String],
    rewardAmount: { type: Number, default: 0 },
    rewardSlipUrls: [String],
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    customer: {
        name: String,
        mobile: String,
        location: {
            address: String,
            lat: Number,
            lng: Number
        }
    },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
