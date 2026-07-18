const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
}

module.exports = connectDB;