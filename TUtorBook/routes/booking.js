// routes/booking.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');

// POST /api/bookings
router.post('/', async (req, res) => {
  const { tutorName, tutorEmail, studentName, sessionType } = req.body;

  try {
    const booking = new Booking({
      tutorName,
      tutorEmail,
      studentName,
      sessionType,
    });

    await booking.save();
    res.status(201).json({ message: 'Booking successful', booking });
  } catch (error) {
    res.status(400).json({ message: 'Error creating booking', error });
  }
});

module.exports = router;
