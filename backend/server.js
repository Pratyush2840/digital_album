const  app = require('./src/app.js');
const connectDB = require('./src/db/db.js');

require('dotenv').config();
connectDB();



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});