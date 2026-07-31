const express = require('express');
const app = express();
const multer=require('multer');
const uploadFile=require('./services/storage.service.js');
const postModel=require('./models/post.model.js');
const userModel=require('./models/user.model.js');
const { hashPassword, comparePassword, generateToken } = require('./services/auth.service.js');
const cors = require('cors');
const authMiddleware = require('./middlewares/auth.middleware.js');

app.use(cors());


app.use(express.json());

const upload =  multer({storage: multer.memoryStorage()});


app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = await userModel.findOne({ username: username.toLowerCase() });
    if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await userModel.create({ username, password: hashedPassword });
    const token = generateToken(user);

    return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: user._id, username: user.username }
    });
});


app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await userModel.findOne({ username: username.toLowerCase() });
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = generateToken(user);

    return res.status(200).json({
        message: 'Logged in successfully',
        token,
        user: { id: user._id, username: user.username }
    });
});


app.post('/create-post', authMiddleware, upload.single("image"), async (req, res) => {
    const result=await uploadFile(req.file.buffer);
    const post=await postModel.create({
        image:result.url,
        caption:req.body.caption,
        user:req.user.id
    })

    return res.status(201).json({
        message:"Post created successfully",
        post
    })

});


app.delete('/posts/:id', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await post.deleteOne();

    return res.status(200).json({ message: 'Post deleted successfully' });
});


app.get('/posts', async (req, res) => {
        const posts=await postModel.find()
            .sort({ createdAt: -1 })
            .populate('user', 'username')
            .populate('comments.user', 'username');
        return res.status(200).json({
            message:"Posts fetched successfully",
            posts
        })
})

app.post('/posts/:id/like', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
        post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
        post.likes.push(userId);
    }

    await post.save();

    return res.status(200).json({
        message: alreadyLiked ? 'Post unliked' : 'Post liked',
        likes: post.likes
    });
});


app.post('/posts/:id/comments', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({ user: req.user.id, text: text.trim() });
    await post.save();
    await post.populate('comments.user', 'username');

    return res.status(201).json({
        message: 'Comment added successfully',
        comments: post.comments
    });
});


app.post('/users/:id/follow-request', authMiddleware, async (req, res) => {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
        return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const target = await userModel.findById(targetId);
    if (!target) {
        return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFollowing = target.followers.some((id) => id.toString() === req.user.id);
    if (alreadyFollowing) {
        return res.status(409).json({ message: 'Already following this user' });
    }

    const alreadyRequested = target.followRequests.some((id) => id.toString() === req.user.id);
    if (alreadyRequested) {
        return res.status(409).json({ message: 'Follow request already sent' });
    }

    target.followRequests.push(req.user.id);
    await target.save();

    return res.status(201).json({ message: 'Follow request sent' });
});


app.post('/users/:id/accept-request', authMiddleware, async (req, res) => {
    const requesterId = req.params.id;
    const currentUser = await userModel.findById(req.user.id);

    const hasRequest = currentUser.followRequests.some((id) => id.toString() === requesterId);
    if (!hasRequest) {
        return res.status(404).json({ message: 'No pending request from this user' });
    }

    const requester = await userModel.findById(requesterId);
    if (!requester) {
        return res.status(404).json({ message: 'User not found' });
    }

    currentUser.followRequests = currentUser.followRequests.filter((id) => id.toString() !== requesterId);
    currentUser.followers.push(requesterId);
    requester.following.push(currentUser._id);

    await currentUser.save();
    await requester.save();

    return res.status(200).json({ message: 'Follow request accepted' });
});


app.post('/users/:id/reject-request', authMiddleware, async (req, res) => {
    const requesterId = req.params.id;
    const currentUser = await userModel.findById(req.user.id);

    const hasRequest = currentUser.followRequests.some((id) => id.toString() === requesterId);
    if (!hasRequest) {
        return res.status(404).json({ message: 'No pending request from this user' });
    }

    currentUser.followRequests = currentUser.followRequests.filter((id) => id.toString() !== requesterId);
    await currentUser.save();

    return res.status(200).json({ message: 'Follow request rejected' });
});


app.post('/users/:id/unfollow', authMiddleware, async (req, res) => {
    const targetId = req.params.id;
    const currentUser = await userModel.findById(req.user.id);
    const target = await userModel.findById(targetId);

    if (!target) {
        return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter((id) => id.toString() !== targetId);
    target.followers = target.followers.filter((id) => id.toString() !== req.user.id);

    await currentUser.save();
    await target.save();

    return res.status(200).json({ message: 'Unfollowed successfully' });
});


app.get('/users/requests', authMiddleware, async (req, res) => {
    const currentUser = await userModel.findById(req.user.id).populate('followRequests', 'username');
    return res.status(200).json({
        message: 'Follow requests fetched successfully',
        requests: currentUser.followRequests.map((u) => ({ id: u._id, username: u.username }))
    });
});


app.get('/users/search', authMiddleware, async (req, res) => {
    const query = (req.query.q || '').trim();
    const filter = {
        _id: { $ne: req.user.id },
        ...(query ? { username: { $regex: query, $options: 'i' } } : {})
    };

    const users = await userModel.find(filter).select('username followers followRequests').limit(20);
    return res.status(200).json({
        message: 'Users fetched successfully',
        users: users.map((u) => ({
            id: u._id,
            username: u.username,
            isFollowing: u.followers.some((id) => id.toString() === req.user.id),
            requestSent: u.followRequests.some((id) => id.toString() === req.user.id)
        }))
    });
});


app.get('/users/:id', authMiddleware, async (req, res) => {
    const user = await userModel.findById(req.params.id).select('username followers following followRequests');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = user._id.toString() === req.user.id;
    const isFollowing = user.followers.some((id) => id.toString() === req.user.id);
    const requestSent = user.followRequests.some((id) => id.toString() === req.user.id);

    return res.status(200).json({
        message: 'User fetched successfully',
        user: {
            id: user._id,
            username: user.username,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            isSelf,
            isFollowing,
            requestSent
        }
    });
});


app.get('/users/:id/posts', authMiddleware, async (req, res) => {
    const posts = await postModel.find({ user: req.params.id })
        .sort({ createdAt: -1 })
        .populate('user', 'username')
        .populate('comments.user', 'username');

    return res.status(200).json({
        message: 'Posts fetched successfully',
        posts
    });
});


module.exports = app;