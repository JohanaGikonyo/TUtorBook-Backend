const express = require('express');
const router = express.Router();
const Tutor = require('../models/Tutor');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Register a new tutor
router.post('/register', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'qualifications', maxCount: 1 }
]), async (req, res) => {
  try {
    const newTutor = new Tutor({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      institution: req.body.institution,
      graduationYear: req.body.graduationYear,
      course: req.body.course,
      password: req.body.password,
      photo: req.files['photo'] ? req.files['photo'][0].path : '',
      qualifications: req.files['qualifications'] ? req.files['qualifications'][0].path : ''
    });

    await newTutor.save();
    res.status(201).json({ message: 'Tutor registered successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering tutor', error });
  }
});

module.exports = router;
