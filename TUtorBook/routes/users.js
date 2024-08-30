const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'qwerthjfds56'; //your jwt token

// Register new user
router.post('/register', async (req, res) => {
  const { name, email, phone, day, month, year, institution, graduationYear, course, password, photo } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).send('Name, email, and password are required.');
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, day, month, year, institution, graduationYear, course, password: hashedPassword, photo });
    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).send('Error registering user: ' + error.message);
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Invalid credentials!');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid credentials!');
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).send('Error logging in: ' + error.message);
  }
});

module.exports = router;
