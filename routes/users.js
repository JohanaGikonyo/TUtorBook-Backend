const express = require("express");
const User = require("../models/User"); // Ensure User model is imported
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Load JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "qwerthjfds56";

// Register new user with profile image upload
router.post("/register", upload.single("photo"), async (req, res) => {
  const { name, email, password, year, course, institution, graduationYear, phone } = req.body;
  const profileImage = req.file ? req.file.path : null; // Getting the uploaded file path
  console.log("Profile Image Path:", profileImage);

  // Check if all required fields are provided
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, password" });
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
      photo: profileImage, // Store the uploaded image path
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
        profileImage: user.profileImage,
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
router.put("/updateProfile", upload.single("profileImage"), async (req, res) => {
  const { name, email, year, course, institution, graduationYear, phone } = req.body;
  const profileImage = req.file ? req.file.path : null;

  try {
    // Find the user by ID from the token
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Find the user and update the provided fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        year,
        course,
        institution,
        graduationYear,
        phone,
        ...(profileImage && { profileImage }), // Only update image if provided
      },
      { new: true } // Return the updated document
    );

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
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
