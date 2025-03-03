const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  hostEmail: { type: String, required: true },
  participants: [
    {
      email: String,
      socketId: String,
      joinedAt: Date,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});
module.exports = mongoose.model("Meeting", meetingSchema);
