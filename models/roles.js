const mongoose = require('mongoose');

const roles = new mongoose.Schema({
    role: {
        type: String,
        required: true,
    },
    permissions: [],
    description: {
        type: String,
    },
});

module.exports = mongoose.model('roles', roles);