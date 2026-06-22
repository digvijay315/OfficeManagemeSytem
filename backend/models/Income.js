const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    mobileNo: { type: String, required: true },
    workType: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);
