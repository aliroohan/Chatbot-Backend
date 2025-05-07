const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        code: {
            type: String,
            default: null
        },
        expiresAt: {
            type: Date,
            default: null
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

adminSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

adminSchema.methods.comparePassword = function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
}

module.exports = mongoose.model('Admin', adminSchema);