const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    videoFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "fs.files",
      required: true,
    },
    subscribers: { type: Number, default: 0 },
    subscribedUsers: { type: [String] },
    thumbnailFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "fs.files",
      required: true,
    },
    fileName: String,
    fileSize: Number,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    videoUrl: {
      type: String,
    },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: {
      type: [String],
      default: [],
    },
    likes: {
      type: [String],
      default: [],
    },
    dislikes: {
      type: [String],
      default: [],
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", VideoSchema);
