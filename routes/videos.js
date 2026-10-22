const router = require('express').Router();
const Video = require('../models/Video');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads Folder စစ်ဆေးခြင်း
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer Disk Storage Configuration for VPS/Local
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
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

// Admin: Upload video to VPS Local Storage
router.post('/', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, category, duration, channel, tags } = req.body;
        
        const hostUrl = req.protocol + '://' + req.get('host');
        const thumbnailUrl = req.files['thumbnail'] ? `${hostUrl}/uploads/${req.files['thumbnail'][0].filename}` : '';
        const videoUrl = req.files['video'] ? `${hostUrl}/uploads/${req.files['video'][0].filename}` : '';

        const newVideo = new Video({
            title,
            channel: channel || "X Monsters Official",
            views: "1 view • Just now",
            duration: duration || "0:30",
            thumbnailUrl,
            videoUrl,
            category: category || "General",
            tags: tags || "",
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
