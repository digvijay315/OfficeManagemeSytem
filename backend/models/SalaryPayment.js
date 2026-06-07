const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    month: { type: String, required: true }, // Format: "YYYY-MM"
    amount: Number,
    date: String,
    slipUrl: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const SalaryPayment = mongoose.model('SalaryPayment', salaryPaymentSchema);

module.exports = SalaryPayment;
