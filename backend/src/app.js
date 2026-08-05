const express = require('express');
const app = express();
const crypto = require('crypto');
const multer=require('multer');
const uploadFile=require('./services/storage.service.js');
const postModel=require('./models/post.model.js');
const userModel=require('./models/user.model.js');
const messageModel=require('./models/message.model.js');
const { hashPassword, comparePassword, generateToken } = require('./services/auth.service.js');
const { sendPasswordResetEmail } = require('./services/email.service.js');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const authMiddleware = require('./middlewares/auth.middleware.js');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());


app.use(express.json());

const upload =  multer({storage: multer.memoryStorage()});

function isVisibleToViewer(owner, viewerId) {
    if (!owner) return false;
    if (owner._id.toString() === viewerId) return true;
    if (!owner.isPrivate) return true;
    return owner.followers.some((id) => id.toString() === viewerId);
}

async function areMutualFollowers(userIdA, userIdB) {
    const [userA, userB] = await Promise.all([
        userModel.findById(userIdA).select('following'),
        userModel.findById(userIdB).select('following')
    ]);
    if (!userA || !userB) return false;
    const aFollowsB = userA.following.some((id) => id.toString() === userIdB);
    const bFollowsA = userB.following.some((id) => id.toString() === userIdA);
    return aFollowsB && bFollowsA;
}


app.post('/auth/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = await userModel.findOne({ username: username.toLowerCase() });
    if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
    }

    if (email) {
        const existingEmail = await userModel.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(409).json({ message: 'Email already in use' });
        }
    }

    const hashedPassword = await hashPassword(password);
    const user = await userModel.create({ username, password: hashedPassword, email: email || undefined });
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

    if (!user.password) {
        return res.status(401).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });
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


app.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (user) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
        try {
            await sendPasswordResetEmail(user.email, resetUrl);
        } catch (err) {
            console.error('Failed to send password reset email:', err.message);
        }
    }

    return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
});


app.post('/auth/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await userModel.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
});


app.post('/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ message: 'Google credential is required' });
    }

    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Google credential' });
    }

    let user = await userModel.findOne({ googleId: payload.sub });

    if (!user) {
        user = await userModel.findOne({ email: payload.email.toLowerCase() });
        if (user) {
            user.googleId = payload.sub;
            if (!user.avatar) user.avatar = payload.picture;
            await user.save();
        }
    }

    if (!user) {
        let baseUsername = payload.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = baseUsername;
        let suffix = 0;
        while (await userModel.findOne({ username })) {
            suffix += 1;
            username = `${baseUsername}${suffix}`;
        }

        user = await userModel.create({
            username,
            email: payload.email.toLowerCase(),
            googleId: payload.sub,
            name: payload.name || '',
            avatar: payload.picture || ''
        });
    }

    const token = generateToken(user);

    return res.status(200).json({
        message: 'Logged in with Google successfully',
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


app.get('/posts/:id', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id)
        .populate('user', 'username isPrivate followers')
        .populate('comments.user', 'username')
        .populate('comments.replies.user', 'username');

    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.isArchived && post.user._id.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (!isVisibleToViewer(post.user, req.user.id)) {
        return res.status(403).json({ message: 'This account is private' });
    }

    const postObj = post.toObject();
    postObj.user = { _id: postObj.user._id, username: postObj.user.username };

    return res.status(200).json({
        message: 'Post fetched successfully',
        post: postObj
    });
});


app.patch('/posts/:id', authMiddleware, async (req, res) => {
    const { caption } = req.body;
    if (typeof caption !== 'string' || !caption.trim()) {
        return res.status(400).json({ message: 'Caption is required' });
    }

    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    post.caption = caption.trim();
    await post.save();

    return res.status(200).json({
        message: 'Post updated successfully',
        post
    });
});


app.patch('/posts/:id/archive', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only archive your own posts' });
    }

    post.isArchived = !post.isArchived;
    await post.save();

    return res.status(200).json({
        message: post.isArchived ? 'Post archived' : 'Post unarchived',
        post
    });
});


app.get('/users/me/archived', authMiddleware, async (req, res) => {
    const posts = await postModel.find({ user: req.user.id, isArchived: true })
        .sort({ createdAt: -1 })
        .populate('user', 'username')
        .populate('comments.user', 'username')
        .populate('comments.replies.user', 'username');

    return res.status(200).json({
        message: 'Archived posts fetched successfully',
        posts
    });
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


app.get('/posts', authMiddleware, async (req, res) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const skip = (page - 1) * limit;

        const posts=await postModel.find({ isArchived: { $ne: true } })
            .sort({ createdAt: -1 })
            .populate('user', 'username isPrivate followers')
            .populate('comments.user', 'username')
        .populate('comments.replies.user', 'username');

        const visiblePosts = posts
            .filter((post) => isVisibleToViewer(post.user, req.user.id))
            .map((post) => {
                const postObj = post.toObject();
                postObj.user = { _id: postObj.user._id, username: postObj.user.username };
                return postObj;
            });

        const pagePosts = visiblePosts.slice(skip, skip + limit);

        return res.status(200).json({
            message:"Posts fetched successfully",
            posts: pagePosts,
            hasMore: skip + limit < visiblePosts.length
        })
})

app.post('/posts/:id/like', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const owner = await userModel.findById(post.user).select('isPrivate followers');
    if (!isVisibleToViewer(owner, req.user.id)) {
        return res.status(403).json({ message: 'This account is private' });
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

    const owner = await userModel.findById(post.user).select('isPrivate followers');
    if (!isVisibleToViewer(owner, req.user.id)) {
        return res.status(403).json({ message: 'This account is private' });
    }

    post.comments.push({ user: req.user.id, text: text.trim() });
    await post.save();
    await post.populate([
        { path: 'comments.user', select: 'username' },
        { path: 'comments.replies.user', select: 'username' }
    ]);

    return res.status(201).json({
        message: 'Comment added successfully',
        comments: post.comments
    });
});


app.post('/posts/:id/save', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const owner = await userModel.findById(post.user).select('isPrivate followers');
    if (!isVisibleToViewer(owner, req.user.id)) {
        return res.status(403).json({ message: 'This account is private' });
    }

    const currentUser = await userModel.findById(req.user.id);
    const alreadySaved = currentUser.savedPosts.some((id) => id.toString() === post._id.toString());

    if (alreadySaved) {
        currentUser.savedPosts = currentUser.savedPosts.filter((id) => id.toString() !== post._id.toString());
    } else {
        currentUser.savedPosts.push(post._id);
    }

    await currentUser.save();

    return res.status(200).json({
        message: alreadySaved ? 'Post unsaved' : 'Post saved',
        savedPosts: currentUser.savedPosts
    });
});


app.get('/users/me/saved', authMiddleware, async (req, res) => {
    const currentUser = await userModel.findById(req.user.id).populate({
        path: 'savedPosts',
        populate: [
            { path: 'user', select: 'username' },
            { path: 'comments.user', select: 'username' },
            { path: 'comments.replies.user', select: 'username' }
        ]
    });

    return res.status(200).json({
        message: 'Saved posts fetched successfully',
        posts: currentUser.savedPosts
    });
});


app.post('/posts/:id/comments/:commentId/like', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const owner = await userModel.findById(post.user).select('isPrivate followers');
    if (!isVisibleToViewer(owner, req.user.id)) {
        return res.status(403).json({ message: 'This account is private' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user.id;
    const alreadyLiked = comment.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
        comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
        comment.likes.push(userId);
    }

    await post.save();
    await post.populate([
        { path: 'comments.user', select: 'username' },
        { path: 'comments.replies.user', select: 'username' }
    ]);

    return res.status(200).json({
        message: alreadyLiked ? 'Comment unliked' : 'Comment liked',
        comments: post.comments
    });
});


app.delete('/posts/:id/comments/:commentId', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    const isCommentAuthor = comment.user.toString() === req.user.id;
    const isPostOwner = post.user.toString() === req.user.id;
    if (!isCommentAuthor && !isPostOwner) {
        return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    comment.deleteOne();
    await post.save();
    await post.populate([
        { path: 'comments.user', select: 'username' },
        { path: 'comments.replies.user', select: 'username' }
    ]);

    return res.status(200).json({
        message: 'Comment deleted successfully',
        comments: post.comments
    });
});


app.post('/posts/:id/comments/:commentId/replies', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ message: 'Reply text is required' });
    }

    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const owner = await userModel.findById(post.user).select('isPrivate followers');
    if (!isVisibleToViewer(owner, req.user.id)) {
        return res.status(403).json({ message: 'This account is private' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({ user: req.user.id, text: text.trim() });
    await post.save();
    await post.populate([
        { path: 'comments.user', select: 'username' },
        { path: 'comments.replies.user', select: 'username' }
    ]);

    return res.status(201).json({
        message: 'Reply added successfully',
        comments: post.comments
    });
});


app.delete('/posts/:id/comments/:commentId/replies/:replyId', authMiddleware, async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
    }

    const isReplyAuthor = reply.user.toString() === req.user.id;
    const isPostOwner = post.user.toString() === req.user.id;
    if (!isReplyAuthor && !isPostOwner) {
        return res.status(403).json({ message: 'You can only delete your own replies' });
    }

    reply.deleteOne();
    await post.save();
    await post.populate([
        { path: 'comments.user', select: 'username' },
        { path: 'comments.replies.user', select: 'username' }
    ]);

    return res.status(200).json({
        message: 'Reply deleted successfully',
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

    const users = await userModel.find(filter).select('username isPrivate followers followRequests').limit(20);
    return res.status(200).json({
        message: 'Users fetched successfully',
        users: users.map((u) => ({
            id: u._id,
            username: u.username,
            isPrivate: u.isPrivate,
            isFollowing: u.followers.some((id) => id.toString() === req.user.id),
            requestSent: u.followRequests.some((id) => id.toString() === req.user.id)
        }))
    });
});


app.patch('/users/me', authMiddleware, upload.single('avatar'), async (req, res) => {
    const currentUser = await userModel.findById(req.user.id);

    if (typeof req.body.name === 'string') {
        currentUser.name = req.body.name.trim();
    }
    if (typeof req.body.bio === 'string') {
        currentUser.bio = req.body.bio.trim();
    }
    if (typeof req.body.isPrivate === 'string') {
        currentUser.isPrivate = req.body.isPrivate === 'true';
    }
    if (req.file) {
        const result = await uploadFile(req.file.buffer);
        currentUser.avatar = result.url;
    }

    await currentUser.save();

    return res.status(200).json({
        message: 'Profile updated successfully',
        user: {
            id: currentUser._id,
            username: currentUser.username,
            name: currentUser.name,
            bio: currentUser.bio,
            avatar: currentUser.avatar,
            isPrivate: currentUser.isPrivate
        }
    });
});


app.get('/users/:id', authMiddleware, async (req, res) => {
    const user = await userModel.findById(req.params.id).select('username name bio avatar isPrivate followers following followRequests');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = user._id.toString() === req.user.id;
    const isFollowing = user.followers.some((id) => id.toString() === req.user.id);
    const requestSent = user.followRequests.some((id) => id.toString() === req.user.id);
    const canViewPosts = isSelf || !user.isPrivate || isFollowing;

    return res.status(200).json({
        message: 'User fetched successfully',
        user: {
            id: user._id,
            username: user.username,
            name: user.name,
            bio: user.bio,
            avatar: user.avatar,
            isPrivate: user.isPrivate,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            isSelf,
            isFollowing,
            requestSent,
            canViewPosts
        }
    });
});


app.get('/users/:id/posts', authMiddleware, async (req, res) => {
    const owner = await userModel.findById(req.params.id).select('isPrivate followers');
    if (!owner) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (!isVisibleToViewer(owner, req.user.id)) {
        return res.status(403).json({ message: 'This account is private' });
    }

    const posts = await postModel.find({ user: req.params.id, isArchived: { $ne: true } })
        .sort({ createdAt: -1 })
        .populate('user', 'username')
        .populate('comments.user', 'username')
        .populate('comments.replies.user', 'username');

    return res.status(200).json({
        message: 'Posts fetched successfully',
        posts
    });
});


app.get('/messages/conversations', authMiddleware, async (req, res) => {
    const currentUser = await userModel.findById(req.user.id).select('following followers');
    const friendIds = currentUser.following.filter((id) =>
        currentUser.followers.some((followerId) => followerId.toString() === id.toString())
    );

    const friends = await userModel.find({ _id: { $in: friendIds } }).select('username name avatar');

    const conversations = await Promise.all(friends.map(async (friend) => {
        const lastMessage = await messageModel.findOne({
            $or: [
                { sender: req.user.id, recipient: friend._id },
                { sender: friend._id, recipient: req.user.id }
            ]
        }).sort({ createdAt: -1 });

        const unreadCount = await messageModel.countDocuments({
            sender: friend._id,
            recipient: req.user.id,
            read: false
        });

        return {
            id: friend._id,
            username: friend.username,
            name: friend.name,
            avatar: friend.avatar,
            lastMessage: lastMessage ? lastMessage.text : null,
            lastMessageAt: lastMessage ? lastMessage.createdAt : null,
            unreadCount
        };
    }));

    conversations.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

    return res.status(200).json({
        message: 'Conversations fetched successfully',
        conversations
    });
});


app.get('/messages/:userId', authMiddleware, async (req, res) => {
    const otherUserId = req.params.userId;

    const mutual = await areMutualFollowers(req.user.id, otherUserId);
    if (!mutual) {
        return res.status(403).json({ message: 'You can only chat with users who follow you back' });
    }

    const messages = await messageModel.find({
        $or: [
            { sender: req.user.id, recipient: otherUserId },
            { sender: otherUserId, recipient: req.user.id }
        ]
    }).sort({ createdAt: 1 });

    await messageModel.updateMany(
        { sender: otherUserId, recipient: req.user.id, read: false },
        { read: true }
    );

    return res.status(200).json({
        message: 'Messages fetched successfully',
        messages
    });
});


app.post('/messages/:userId', authMiddleware, async (req, res) => {
    const otherUserId = req.params.userId;
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ message: 'Message text is required' });
    }

    const mutual = await areMutualFollowers(req.user.id, otherUserId);
    if (!mutual) {
        return res.status(403).json({ message: 'You can only chat with users who follow you back' });
    }

    const savedMessage = await messageModel.create({
        sender: req.user.id,
        recipient: otherUserId,
        text: text.trim()
    });

    const io = req.app.get('io');
    if (io) {
        io.to(otherUserId).emit('new-message', savedMessage);
        io.to(req.user.id).emit('new-message', savedMessage);
    }

    return res.status(201).json({
        message: 'Message sent successfully',
        savedMessage
    });
});


module.exports = app;