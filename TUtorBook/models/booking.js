// models/booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tutorName: { type: String, required: true },
  tutorEmail: { type: String, required: true },
  studentName: { type: String, required: true },
  sessionType: { type: String, enum: ['online', 'physical'], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
