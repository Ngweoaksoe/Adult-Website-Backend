const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const VideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    channel: { type: String, required: true },
    views: { type: String, default: "1 view • Just now" },
    duration: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    videoUrl: { type: String, required: true },
    category: { type: String, required: true },
    likes: { type: Number, default: 0 },
    comments: [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);