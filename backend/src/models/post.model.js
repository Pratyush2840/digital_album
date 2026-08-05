const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
    image : String,
    caption : String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    isArchived: { type: Boolean, default: false }
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);
module.exports = Post;