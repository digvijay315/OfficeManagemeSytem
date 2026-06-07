const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    date: String,
    description: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    slipUrl: { type: String }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Fund = mongoose.model('Fund', fundSchema);

module.exports = Fund;
