const mongoose = require('mongoose');

const predefinedTaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String
});

const PredefinedTask = mongoose.model('PredefinedTask', predefinedTaskSchema);

module.exports = PredefinedTask;
