const express = require('express');
const app = express();
const multer=require('multer');
const uploadFile=require('./services/storage.service.js');
const postModel=require('./models/post.model.js');
const userModel=require('./models/user.model.js');
const { hashPassword, comparePassword, generateToken } = require('./services/auth.service.js');
const cors = require('cors');

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


app.post('/create-post', upload.single("image"), async (req, res) => {
    console.log(req.body);
    console.log(req.file);
    const result=await uploadFile(req.file.buffer);
    const post=await postModel.create({
        image:result.url,
        caption:req.body.caption
    })

    return res.status(201).json({
        message:"Post created successfully",
        post
    })

});


app.get('/posts', async (req, res) => {
        const posts=await postModel.find();
        return res.status(200).json({
            message:"Posts fetched successfully",
            posts
        })
})

module.exports = app;