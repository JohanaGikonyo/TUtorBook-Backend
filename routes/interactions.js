const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// Like a video
router.post('/like/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        video.likes += 1;
        await video.save();
        res.json({ likes: video.likes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Dislike a video
router.post('/dislike/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        video.dislikes += 1;
        await video.save();
        res.json({ dislikes: video.dislikes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Subscribe to a channel
router.post('/subscribe/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        video.subscriptions += 1;
        await video.save();
        res.json({ subscriptions: video.subscriptions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
