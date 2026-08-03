require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app.js');
const connectDB = require('./src/db/db.js');
const initSocket = require('./src/socket.js');

connectDB();

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

initSocket(io);
app.set('io', io);

httpServer.listen(3000, () => {
    console.log('Server is running on port 3000');
});
