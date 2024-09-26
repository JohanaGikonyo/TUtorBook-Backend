const express = require("express");
const multer = require("multer");
const path = require("path");
const Video = require("../models/Video");
const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload a video
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { title } = req.body;
    const videoUrl = req.file.path.replace("\\", "/"); // Ensure correct path format

    const newVideo = new Video({ title, videoUrl });
    await newVideo.save();

    // Emit new video event
    const io = req.app.get("socketio");
    io.emit("newVideo", { title: newVideo.title, videoUrl: newVideo.videoUrl });

    res.status(201).json({ message: "Video uploaded successfully!", video: newVideo });
  } catch (error) {
    console.error("Failed to upload video:", error);
    res.status(500).json({ message: "Failed to upload video. Please try again.", error });
  }
});

// Get all videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json(videos);
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    res.status(500).json({ message: "Failed to fetch videos. Please try again.", error });
  }
});

// Like a video
router.post("/like/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    video.likes = (video.likes || 0) + 1;
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    console.error("Failed to like video:", error);
    res.status(500).json({ message: "Failed to like video. Please try again.", error });
  }
});

// Dislike a video
router.post("/dislike/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    video.dislikes = (video.dislikes || 0) + 1;
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    console.error("Failed to dislike video:", error);
    res.status(500).json({ message: "Failed to dislike video. Please try again.", error });
  }
});

// Add a comment to a video
router.post("/comment/:id", async (req, res) => {
  try {
    const { comment } = req.body;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    video.comments = video.comments || [];
    video.comments.push({ text: comment, date: new Date() });
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    console.error("Failed to add comment:", error);
    res.status(500).json({ message: "Failed to add comment. Please try again.", error });
  }
});

module.exports = router;
