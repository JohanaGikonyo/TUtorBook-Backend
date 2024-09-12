const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/'); // Specify a subdirectory for images
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with the current timestamp
    cb(null, 'img_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Define a schema for your image
const ImageSchema = new mongoose.Schema({
  title: String,
  description: String,
  filename: String,
  path: String,
});

const Image = mongoose.model('Image', ImageSchema);

// Endpoint to handle image uploads
router.post('/upload', upload.single('file'), async (req, res) => {
  const { title, description } = req.body;

  // Save the uploaded file details to MongoDB
  const image = new Image({
    title,
    description,
    filename: req.file.filename,
    path: req.file.path
  });

  try {
    await image.save();
    res.status(201).json({ message: 'Image uploaded successfully', image });
  } catch (error) {
    res.status(500).json({ message: 'Error saving image', error });
  }
});

// Endpoint to retrieve uploaded images
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.sendFile(path.join(__dirname, '..', image.path));
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving image', error });
  }
});

module.exports = router;
