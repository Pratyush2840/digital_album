const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    bio: {
        type: String,
        trim: true,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
