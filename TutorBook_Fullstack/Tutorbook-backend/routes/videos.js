const express = require('express');
const multer = require('multer');
const Video = require('../models/Video');
const path = require('path');
const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { title } = req.body;
    const videoUrl = req.file.path.replace('uploads/', 'uploads/');

    const newVideo = new Video({ title, videoUrl });
    await newVideo.save();

    // Emit new video event
    const io = req.app.get('socketio');
    io.emit('newVideo', { title: newVideo.title, videoUrl: newVideo.videoUrl });

    res.status(201).json({ message: 'Video uploaded successfully', video: newVideo });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload video', error });
  }
});

router.get('/', async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch videos', error });
  }
});

module.exports = router;
