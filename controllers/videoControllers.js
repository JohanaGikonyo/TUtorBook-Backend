const tmp = require("tmp");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const mongoose = require("mongoose");
const sharp = require("sharp");
const { Readable } = require("stream");

const Video = require("../models/Video.js");
// const User = require("../models/Useconst");

const postVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file provided" });
    }

    const { title, desc, category } = req.body;

    // Save buffer to a temporary file
    const tempFile = tmp.fileSync({ postfix: ".mp4" });
    fs.writeFileSync(tempFile.name, req.file.buffer);

    // Get video metadata with proper error handling
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempFile.name, (err, metadata) => {
        if (err) {
          console.error("Error getting video metadata:", err);
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });

    // Find the video stream and get dimensions
    const videoStreams = metadata.streams.find((stream) => stream.codec_type === "video");

    if (!videoStreams) {
      throw new Error("No video stream found in file");
    }

    // Get dimensions with fallback values
    const videoWidth = videoStreams.width || 1280; // default to 1280 if width not found
    const videoHeight = videoStreams.height || 720; // default to 720 if height not found
    const aspectRatio = videoWidth / videoHeight;

    // Log dimensions for debugging
    console.log("Video dimensions:", {
      width: videoWidth,
      height: videoHeight,
      aspectRatio,
    });

    // Calculate thumbnail dimensions
    const targetWidth = 720;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    // Ensure dimensions are valid numbers
    if (isNaN(targetHeight) || targetHeight <= 0) {
      console.error("Invalid calculated height:", targetHeight);
      throw new Error("Failed to calculate valid thumbnail dimensions");
    }

    // Generate thumbnail
    const tempFolder = tmp.dirSync().name;
    const duration = metadata.format.duration || 0;
    const screenshotTime = Math.min(Math.max(duration * 0.15, 1), 15); // Between 1 and 15 seconds

    console.log("Generating thumbnail with dimensions:", `${targetWidth}x${targetHeight}`);

    await new Promise((resolve, reject) => {
      ffmpeg(tempFile.name)
        .screenshots({
          timestamps: [screenshotTime],
          filename: "%b.png",
          folder: tempFolder,
          size: `${targetWidth}x${targetHeight}`,
        })
        .on("end", () => {
          console.log("Thumbnail generated successfully");
          resolve();
        })
        .on("error", (err) => {
          console.error("Error generating thumbnail:", err);
          reject(err);
        });
    });

    // Read the generated thumbnail
    const thumbnailPath = `${tempFolder}/${tempFile.name.split("/").pop().replace(".mp4", "")}.png`;
    const thumbnailBuffer = await fs.promises.readFile(thumbnailPath);

    // Clean up temporary files
    tempFile.removeCallback();
    fs.rmSync(tempFolder, { recursive: true, force: true });

    // Upload video to MongoDB (GridFS)
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "videos",
    });

    const videoUploadStream = bucket.openUploadStream(`${title}-${Date.now()}.mp4`, {
      metadata: {
        contentType: "video/mp4",
        width: videoWidth,
        height: videoHeight,
        duration: metadata.format.duration,
      },
    });

    const videoStream = Readable.from(req.file.buffer);
    await new Promise((resolve, reject) => {
      videoStream.pipe(videoUploadStream).on("finish", resolve).on("error", reject);
    });

    // Upload thumbnail to MongoDB (GridFS)
    const thumbnailUploadStream = bucket.openUploadStream(`thumbnail-${Date.now()}.png`, {
      metadata: {
        contentType: "image/png",
        width: targetWidth,
        height: targetHeight,
        aspectRatio,
      },
    });

    const thumbnailStream = Readable.from(thumbnailBuffer);
    await new Promise((resolve, reject) => {
      thumbnailStream.pipe(thumbnailUploadStream).on("finish", resolve).on("error", reject);
    });

    // Save video metadata to MongoDB
    const video = new Video({
      title,
      desc,
      category,
      videoFileId: videoUploadStream.id,
      thumbnailFileId: thumbnailUploadStream.id,
      duration: metadata.format.duration || 0,
      dimensions: {
        width: videoWidth,
        height: videoHeight,
        aspectRatio,
      },
      thumbnailDimensions: {
        width: targetWidth,
        height: targetHeight,
        aspectRatio,
      },
    });

    await video.save();

    res.status(201).json({ success: true, video });
  } catch (error) {
    console.error("Upload error details:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading the video",
      error: error.message,
    });
  }
};

// Add this new endpoint to get files from GridFS
const getVideos = async (req, res) => {
  try {
    const videos = await Video.find();

    if (!videos || videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No videos found",
      });
    }

    const videosWithThumbnails = videos.map((video) => ({
      _id: video._id,
      title: video.title,
      desc: video.desc,
      category: video.category,
      duration: video.duration,
      likes: video.likes,
      views: video.views,
      subscribers: video.subscribers,
      uploadDate: video.uploadDate,
      thumbnailFileId: video.thumbnailFileId,
      videoFileId: video.videoFileId,
    }));
    console.log(videosWithThumbnails);
    res.status(200).json({
      success: true,
      videos: videosWithThumbnails,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching videos",
      error: error.message,
    });
  }
};

// New getFile function to serve files from GridFS
const getFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID",
      });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "videos",
    });

    // Check if file exists
    const files = await bucket
      .find({
        _id: new mongoose.Types.ObjectId(fileId),
      })
      .toArray();

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Set appropriate headers
    res.set("Content-Type", files[0].contentType || "application/octet-stream");
    res.set("Content-Length", files[0].length);
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    // Stream the file to response
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving file",
      error: error.message,
    });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { title, desc, category } = req.body;

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found!" });
    }
    // update only the fields that are required
    if (title) video.title = title;
    if (desc) video.desc = desc;
    if (category) video.category = category;

    await video.save();

    res.status(200).json({ sucsess: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating video!", error });
  }
};

// delete video
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found!" });
    }
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "videos",
    });

    // delete video file
    await bucket.delete(video.videoFileId);
    // delete thumbnail file
    await bucket.delete(video.thumbnailFileId);
    // delete video document
    await video.deleteOne();
    res.status(200).json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting video!", error });
  }
};

const subscribe = async (req, res, next) => {
  try {
    console.log("Subscribe endpoint hit");
    console.log("User from token:", req.user);
    console.log("Channel ID:", req.params.id);

    // Check if we have a valid user from the token
    if (!req.user || !req.user._id) {
      return res.status(403).json({ message: "User not authenticated properly" });
    }

    // Find the current user
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the channel to subscribe to
    const channelToSubscribe = await User.findById(req.params.id);
    if (!channelToSubscribe) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // // Check if user is trying to subscribe to themselves
    // if (req.user._id === req.params.id) {
    //   return res.status(400).json({ message: "You cannot subscribe to yourself" });
    // }

    // Check if already subscribed
    if (currentUser.subscribedUsers.includes(req.params.id)) {
      return res.status(400).json({ message: "Already subscribed to this channel" });
    }

    // Update the current user's subscriptions
    await User.findByIdAndUpdate(req.user._id, {
      $push: { subscribedUsers: req.params.id },
    });

    // Update the channel's subscriber count
    await User.findByIdAndUpdate(req.params.id, {
      $inc: { subscribers: 1 },
    });

    res.status(200).json({ message: "Subscription successful" });
  } catch (err) {
    console.error("Subscribe error:", err);
    next(err);
  }
};
const unsubscribe = async (req, res, next) => {
  try {
    console.log("Unsubscribe  endpoint hit");
    console.log("User from token:", req.user);
    console.log("Channel ID:", req.params.id);

    // Check if we have a valid user from the token
    if (!req.user || !req.user._id) {
      return res.status(403).json({ message: "User not authenticated properly" });
    }

    // Find the current user
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the channel to subscribe to
    const channelToUnSubscribe = await User.findById(req.params.id);
    if (!channelToUnSubscribe) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // // Check if user is trying to subscribe to themselves
    // if (req.user._id === req.params.id) {
    //   return res.status(400).json({ message: "You cannot subscribe to yourself" });
    // }

    // Check if already subscribed
    if (currentUser.subscribedUsers.includes(req.params.id)) {
      return res.status(400).json({ message: "Already subscribed to this channel" });
    }

    // Update the current user's subscriptions
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { subscribedUsers: req.params.id },
    });

    // Update the channel's subscriber count
    await User.findByIdAndUpdate(req.params.id, {
      $inc: { subscribers: 1 },
    });

    res.status(200).json({ message: "Unsubscription successful" });
  } catch (err) {
    console.error("UnSubscribe error:", err);
    next(err);
  }
};

const like = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    const userId = req.user._id;

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.likes.includes(userId)) {
      return res.status(400).json({ message: "Video already liked" });
    }

    // Remove from dislikes if present
    if (video.dislikes.includes(userId)) {
      await Video.findByIdAndUpdate(req.params.id, {
        $pull: { dislikes: userId },
      });
    }

    // Add to likes
    await Video.findByIdAndUpdate(req.params.id, {
      $addToSet: { likes: userId },
    });

    const updatedVideo = await Video.findById(req.params.id);

    res.status(200).json({
      success: true,
      likes: updatedVideo.likes.length,
      dislikes: updatedVideo.dislikes.length,
    });
  } catch (err) {
    next(err);
  }
};

const dislike = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    const userId = req.user._id;

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.dislikes.includes(userId)) {
      return res.status(400).json({ message: "Video already disliked" });
    }

    // Remove from likes if present
    if (video.likes.includes(userId)) {
      await Video.findByIdAndUpdate(req.params.id, {
        $pull: { likes: userId },
      });
    }

    // Add to dislikes
    await Video.findByIdAndUpdate(req.params.id, {
      $addToSet: { dislikes: userId },
    });

    const updatedVideo = await Video.findById(req.params.id);

    res.status(200).json({
      success: true,
      likes: updatedVideo.likes.length,
      dislikes: updatedVideo.dislikes.length,
    });
  } catch (err) {
    next(err);
  }
};
const addView = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    const userId = req.user._id;

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if viewedBy array exists, if not create it
    if (!video.viewedBy) {
      await Video.findByIdAndUpdate(req.params.id, {
        $set: { viewedBy: [] },
      });
    }

    // Check if user has already viewed
    const updatedVideo = await Video.findOneAndUpdate(
      {
        _id: req.params.id,
        viewedBy: { $ne: userId }, // Only update if user hasn't viewed
      },
      {
        $inc: { views: 1 },
        $push: { viewedBy: userId },
      },
      { new: true }
    );

    if (!updatedVideo) {
      // User has already viewed, just return current count
      const currentVideo = await Video.findById(req.params.id);
      return res.status(200).json({
        success: true,
        views: currentVideo.views,
      });
    }

    res.status(200).json({
      success: true,
      views: updatedVideo.views,
    });
  } catch (err) {
    console.error("View increment error:", err);
    next(err);
  }
};
module.exports = {
  postVideo,
  getFile,
  getVideos,
  updateVideo,
  deleteVideo,
  subscribe,
  unsubscribe,
  like,
  dislike,
  addView,
};
