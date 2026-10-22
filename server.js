const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage Configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'streamvibe_uploads',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'webm']
  }
});

const upload = multer({ storage: storage });

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/streamvibe')
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.log('DB Connection Error:', err));

// Routes (Note: ဗီဒီယို တင်သည့် Upload logic ကို routes/videos.js ထဲတွင် သို့မဟုတ် ဤနေရာတွင် ထည့်သွင်းနိုင်သည်)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));