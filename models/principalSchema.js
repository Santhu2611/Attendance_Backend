const mongoose = require('mongoose');

const principal = new mongoose.Schema({
    idno: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    college: {
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
    photo: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    collegeCode: {
        type: String,
        required: true,
    },
    collegeAddress: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Principal', principal);