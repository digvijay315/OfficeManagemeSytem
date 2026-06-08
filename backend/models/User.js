const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'staff' },
    salary: { type: Number, default: 0 },
    mobile: { type: String },
    Upload: {
        pic: [String],
        document: [String]
    },
    documentName: String,
    documentNo: String,
    address: String,
    bankName: String,
    accountNo: String,
    ifscCode: String,
    branchName: String,
    joinedDate: String,
    lastSeenRewardCount: { type: Number, default: 0 }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
