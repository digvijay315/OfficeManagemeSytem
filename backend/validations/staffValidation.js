const Joi = require('joi');

const staffSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    mobile: Joi.string().optional().allow(''),
    salary: Joi.number().optional(),
    Upload: Joi.object({
        pic: Joi.array().items(Joi.string()),
        document: Joi.array().items(Joi.string())
    }).optional(),
    documentName: Joi.string().optional().allow(''),
    documentNo: Joi.string().optional().allow(''),
    address: Joi.string().optional().allow(''),
    bankName: Joi.string().optional().allow(''),
    accountNo: Joi.string().optional().allow(''),
    ifscCode: Joi.string().optional().allow(''),
    branchName: Joi.string().optional().allow(''),
    joinedDate: Joi.string().optional().allow('')
});

const subadminSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    mobile: Joi.string().optional().allow('')
});

module.exports = { staffSchema, subadminSchema };
