const express = require("express");
const router = express.Router();
const Tutor = require("../models/Tutor");
const multer = require("multer");
const bcrypt = require("bcryptjs");

// Configure multer for file uploads (for photo and qualifications)
const upload = multer({ dest: "uploads/" });

// Register a new tutor
router.post("/register", async (req, res) => {
  try {
    console.log(req.body.name, req.body.email, req.body.qualifications);
    const { name, email, phone, institution, course, password, qualifications, photo } = req.body;

    const existingUser = await Tutor.findOne({ email });
    if (existingUser) {
      console.log("Tutor exists");
      return res.status(400).json({ error: "You are already a tutor." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If you have qualifications as files, use multer or base64
    const newTutor = new Tutor({
      name: name,
      email: email,
      phone: phone,
      institution: institution,
      qualifications: qualifications, // Assuming qualifications is a string, modify if it's a file
      photo: photo, // Storing the path of the uploaded file
      course: course,
      password: hashedPassword,
    });

    await newTutor.save();
    console.log("Saved Tutor");
    res.status(201).json({
      message: "Tutor registered successfully",
      user: {
        id: newTutor._id,
        name: newTutor.name,
        email: newTutor.email,
        institution: newTutor.institution,
        course: newTutor.course,
        phone: newTutor.phone,
        photo: newTutor.photo, // Path to the saved photo
        qualifications: newTutor.qualifications,
      },
    });
  } catch (error) {
    console.log("An error has occurred");
    res.status(500).json({ message: "Error registering tutor", error });
  }
});
router.get("/gettutors", async (req, res) => {
  try {
    const tutors = await Tutor.find(); // Adjust based on your actual User model method
    res.json(tutors);
  } catch (error) {
    console.error("Error fetching tutors:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
