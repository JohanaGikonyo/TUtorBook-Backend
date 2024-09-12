const Video = require('../models/Video');
const path = require('path');

// Controller for fetching all videos
exports.getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find();
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: 'Error fetching videos' });
    }
};

// Controller for uploading a video
exports.uploadVideo = async (req, res) => {
    try {
        const videoUrl = req.file.path; // Path to the uploaded file
        const { title } = req.body;

        const newVideo = new Video({
            title,
            videoUrl: videoUrl.replace('\\', '/'), // Make sure the path is correct for different OS
        });

        await newVideo.save();
        res.status(201).json(newVideo);
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ message: 'Error uploading video' });
    }
};

// Controller for liking a video
exports.likeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await Video.findById(id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        video.likes += 1;
        await video.save();
        res.status(200).json(video);
    } catch (error) {
        console.error('Error liking video:', error);
        res.status(500).json({ message: 'Error liking video' });
    }
};

// Controller for disliking a video
exports.dislikeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await Video.findById(id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        video.dislikes += 1;
        await video.save();
        res.status(200).json(video);
    } catch (error) {
        console.error('Error disliking video:', error);
        res.status(500).json({ message: 'Error disliking video' });
    }
};

// Controller for adding a comment to a video
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const video = await Video.findById(id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        video.comments.push({ text: comment, date: new Date() });
        await video.save();
        res.status(200).json(video);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
};
