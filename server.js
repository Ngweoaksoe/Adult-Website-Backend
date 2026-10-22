const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Uploads Folder စစ်ဆေးပြီး မရှိရင် အလိုအလျောက် ဆောက်ပေးခြင်း
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Local Storage Preview အတွက် Static Route ချိတ်ဆက်ခြင်း
app.use('/uploads', express.static('uploads'));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/xmonsters')
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.log('DB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
