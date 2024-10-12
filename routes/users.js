const express = require("express");
const User = require("../models/User"); // Ensure User model is imported
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Load JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "qwerthjfds56";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Adjust the destination as needed
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Set limit to 50 MB
});
// upload.single("photo"),
// Register new user with profile image upload
router.post("/register", async (req, res) => {
  console.log("Trying to register");
  console.log("req body ", req.body);
  const photo = req.body.photo;
  const { name, email, password, year, course, institution, graduationYear, phone } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !password || !photo) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      year,
      course,
      institution,
      graduationYear,
      phone,
      photo,
    });

    // Save user to the database
    await newUser.save();

    // Optionally create JWT token here
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "1h" });

    // Return success response with token and user details (excluding password)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        year: newUser.year,
        course: newUser.course,
        institution: newUser.institution,
        graduationYear: newUser.graduationYear,
        phone: newUser.phone,
        profileImage: newUser.photo,
      },
      token, // JWT token for immediate use
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials!" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials!" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    // Return the token in the response
    res.json({
      message: "Login successful",
      token, // JWT token sent to the frontend
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        year: user.year,
        course: user.course,
        institution: user.institution,
        graduationYear: user.graduationYear,
        phone: user.phone,
        profileImage: user.photo,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Get all users
router.get("/getUsers", async (req, res) => {
  try {
    const users = await User.find(); // Adjust based on your actual User model method
    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile

router.post("/updateProfile/:userId", upload.single("photo"), async (req, res) => {
  try {
    const { userId } = req.params;
    const photo = req.body.photo; // Multer handles file uploads

    console.log("Received file:", photo);
    const { name, email, year, course, institution, graduationYear, phone } = req.body;

    console.log("Ready to update user", name, email, year);
    // Find the user and update the provided fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,

      {
        $set: {
          name: name,
          email: email,
          year: year,
          course: course,
          institution: institution,
          graduationYear: graduationYear,
          phone: phone,
          photo: photo,
        },
      },
      { new: true }
    ); // Return the updated document
    // console.log("Updated values:", updatedUser);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        year: updatedUser.year,
        course: updatedUser.course,
        institution: updatedUser.institution,
        graduationYear: updatedUser.graduationYear,
        phone: updatedUser.phone,
        profileImage: updatedUser.photo, // Send updated image path
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
