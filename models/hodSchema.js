const mongoose = require('mongoose');

const hodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    
    phoneNumber: {
        type: String,
        required: true,
    },
    idno: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    photo: {
        type: String,
        // required: true,
    },
    role: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    access: {
        granted: { type: Boolean, default: false },
        expiresAt: { type: Date, default: null }
    }
});

const Hod = mongoose.model('Hod', hodSchema);

module.exports = Hod;
