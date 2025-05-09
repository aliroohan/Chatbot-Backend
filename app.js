const express = require('express');
const bodyParser = require('body-parser');
const environment = require('dotenv');
const cors = require('cors');
const dbConfig = require('./config/dbConfig');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

environment.config();
dbConfig.run();


app.use(express.json());
app.use(cors());
app.use(bodyParser.json());


app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);


app.listen(process.env.PORT, () => {
    console.log('Server is running on port 3000')
});