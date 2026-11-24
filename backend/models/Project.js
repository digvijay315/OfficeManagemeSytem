const mongoose = require('mongoose');

const additionalServiceSchema = new mongoose.Schema({
    serviceType: {
        type: String,
        required: true,
        default: 'Domain'
    },
    title: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    duration: { type: String, default: '1 Year' },
    startDate: { type: String, default: '' },
    expiryDate: { type: String, default: '' },
    provider: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
        type: String,
        enum: ['active', 'expiring_soon', 'expired', 'renewed'],
        default: 'active'
    }
}, { _id: true });

const projectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    projectType: { 
        type: String, 
        required: true,
        default: 'Website'
    },
    category: { 
        type: String, 
        required: true,
        default: 'Shop'
    },
    status: {
        type: String,
        enum: ['In Progress', 'Completed', 'Live', 'Maintenance', 'On Hold', 'Cancelled'],
        default: 'In Progress'
    },
    projectUrl: { 
        type: String, 
        default: '', 
        trim: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    techStack: { 
        type: String, 
        default: '' 
    },

    // Dates
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    publishDate: { type: String, default: '' },

    // Base Costs & Initial Tenures
    softwarePrice: { type: Number, default: 0 },
    
    serverPrice: { type: Number, default: 0 },
    serverDuration: { type: String, default: '1 Year' },
    serverStartDate: { type: String, default: '' },
    serverExpiryDate: { type: String, default: '' },

    amcPrice: { type: Number, default: 0 },
    amcDuration: { type: String, default: '1 Year' },
    amcStartDate: { type: String, default: '' },
    amcExpiryDate: { type: String, default: '' },

    // Dynamic Extra Services & Renewals (Domain, SSL, extra servers, etc.)
    additionalServices: [additionalServiceSchema],

    // Client / Contact Information
    clientName: { type: String, default: '' },
    clientPhone: { type: String, default: '' },
    clientEmail: { type: String, default: '' },
    clientOrganization: { type: String, default: '' },
    clientAddress: { type: String, default: '' },

    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, {
    timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
