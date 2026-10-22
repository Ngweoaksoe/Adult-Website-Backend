const router = require('express').Router();
const Video = require('../models/Video');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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

// Get videos with Pagination & Filtering
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }
        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: 'i' };
        }

        const totalVideos = await Video.countDocuments(filter);
        const videos = await Video.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            videos,
            currentPage: page,
            totalPages: Math.ceil(totalVideos / limit),
            totalVideos
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Analytics Stats
router.get('/stats/admin', async (req, res) => {
    try {
        const totalVideos = await Video.countDocuments();
        const allVids = await Video.find();
        let totalViewsCount = 0;
        
        allVids.forEach(v => {
            const match = v.views.match(/(\d+)/);
            if (match) totalViewsCount += parseInt(match[0]);
        });

        res.status(200).json({
            totalVideos,
            totalViews: totalViewsCount + " Views",
            subscribers: "1.4M"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Upload video to Cloudinary
router.post('/', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, category, duration, channel } = req.body;
        
        // Cloudinary ကပေးတဲ့ Secure URL များကို ရယူခြင်း
        const thumbnailUrl = req.files['thumbnail'] ? req.files['thumbnail'][0].path : '';
        const videoUrl = req.files['video'] ? req.files['video'][0].path : '';

        const newVideo = new Video({
            title,
            channel: channel || "StreamVibe Official",
            views: "1 view • Just now",
            duration: duration || "0:30",
            thumbnailUrl,
            videoUrl,
            category: category || "Tech",
            likes: 0,
            comments: []
        });

        const savedVideo = await newVideo.save();
        res.status(201).json(savedVideo);
    } catch (err) {
        console.log("Upload Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Edit video details
router.put('/:id', async (req, res) => {
    try {
        const { title, category } = req.body;
        const updatedVideo = await Video.findByIdAndUpdate(
            req.params.id,
            { title, category },
            { new: true }
        );
        res.status(200).json(updatedVideo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete video by ID
router.delete('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        await Video.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Like video
router.put('/:id/like', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        video.likes += 1;
        await video.save();
        res.status(200).json({ likes: video.likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add comment
router.post('/:id/comment', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        video.comments.unshift({
            user: req.body.username || "Visitor",
            text: req.body.text
        });
        await video.save();
        res.status(200).json(video.comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;