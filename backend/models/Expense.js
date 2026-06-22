const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    reason: { type: String, required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    date: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
