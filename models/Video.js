const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  comments: [{
    text: String,
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Video', videoSchema);
