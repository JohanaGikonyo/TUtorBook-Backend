const { createError } = require("../error.js");
const Comment = require("../models/Comment.js");
const Video = require("../models/Video.js");

const addComment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const videoId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const newComment = new Comment({
      userId,
      videoId,
      text,
    });

    const savedComment = await newComment.save();

    // Update video with new comment
    await Video.findByIdAndUpdate(videoId, {
      $push: { comments: savedComment._id },
    });

    // Populate user details for the response
    const populatedComment = await Comment.findById(savedComment._id).populate("userId", "name profileImage");

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (err) {
    next(err);
  }
};

const getComments = async (req, res, next) => {
  try {
    const videoId = req.params.id;

    const comments = await Comment.find({ videoId }).populate("userId", "name profileImage").sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (err) {
    next(createError(500, "Error fetching comments"));
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return next(createError(404, "Comment not found"));
    }

    const video = await Video.findById(comment.videoId);
    if (!video) {
      return next(createError(404, "Video not found"));
    }

    // Check if user is comment owner or video owner
    if (req.user.id === comment.userId.toString() || req.user.id === video.userId.toString()) {
      await Comment.findByIdAndDelete(req.params.id);

      // Remove comment from video's comments array
      await Video.findByIdAndUpdate(comment.videoId, {
        $pull: { comments: req.params.id },
      });

      res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } else {
      return next(createError(403, "You can only delete your own comments"));
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
};
