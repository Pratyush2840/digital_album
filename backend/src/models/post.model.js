const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
    image : String,
    caption : String,
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;