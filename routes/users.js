const express = require('express');
const User = require('../models/User');  // Ensure User model is imported
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));  // Absolute path for uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);  // Unique file name
    }
});
const upload = multer({ storage: storage });

// Load JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'qwerthjfds56';

// Register new user with profile image upload
router.post('/register', upload.single('profileImage'), async (req, res) => {
    const { name, email, password } = req.body;
    const profileImage = req.file ? req.file.path : null;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            profileImage,  // Store image path
        });

        await newUser.save();

        res.status(201).json({ 
            message: 'User registered successfully', 
            newUser 
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials!' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
