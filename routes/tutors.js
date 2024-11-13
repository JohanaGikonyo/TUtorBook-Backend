const express = require("express");
const router = express.Router();
const Tutor = require("../models/Tutor");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secretKey = process.env.JWT_SECRET || "qwerthjfds56";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// Configure multer for file uploads (for photo and qualifications)
const upload = multer({ dest: "uploads/" });

// Register a new tutor
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, institution, course, password, qualifications, photo } = req.body;

    const existingUser = await Tutor.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "You are already a tutor." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTutor = new Tutor({
      name,
      email,
      phone,
      institution,
      course,
      qualifications,
      photo,
      password: hashedPassword,
    });

    await newTutor.save();

    // Generate JWT token
    const Tutortoken = jwt.sign({ id: newTutor._id }, secretKey, { expiresIn: "1h" });

    res.status(201).json({
      message: "Tutor registered successfully",
      Tutortoken,
      tutorDetails: {
        id: newTutor._id,
        name: newTutor.name,
        email: newTutor.email,
        institution: newTutor.institution,
        course: newTutor.course,
        phone: newTutor.phone,
        photo: newTutor.photo,
        qualifications: newTutor.qualifications,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering tutor", error });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, tutor.password);
    if (!isPasswordValid) {
      console.log("Invalid email");
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT token
    const Tutortoken = jwt.sign({ id: tutor._id }, secretKey, { expiresIn: "1h" });

    res.status(201).json({
      Tutortoken,
      tutorDetails: {
        id: tutor.id,
        name: tutor.name,
        email: tutor.email,
        institution: tutor.institution,
        course: tutor.course,
        phone: tutor.phone,
        photo: tutor.photo,
        qualifications: tutor.qualifications,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gettutors", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const tutors = await Tutor.find().skip(skip).limit(Number(limit));

    const totalTutors = await Tutor.countDocuments(); // Total number of tutors
    const hasMore = skip + tutors.length < totalTutors; // Check if there's more data to load

    res.json({
      tutors,
      hasMore,
      totalTutors,
    });
  } catch (error) {
    console.error("Error fetching tutors:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/editTutor/:tutor_id", async (req, res) => {
  const { tutor_id } = req.params;
  const { name, email, institution, course, phone, qualifications, password, photo } = req.body;

  console.log(tutor_id); // Check the tutor_id value
  try {
    let processedPhoto = photo;

    if (photo.startsWith("data:image/jpeg;base64,data:image/jpeg;base64,")) {
      processedPhoto = photo.replace("data:image/jpeg;base64,data:image/jpeg;base64,", "data:image/jpeg;base64,");
    } else if (!photo.startsWith("data:image/jpeg;base64,")) {
      processedPhoto = `data:image/jpeg;base64,${photo}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedTutor = await Tutor.findByIdAndUpdate(
      tutor_id,
      {
        $set: {
          name: name,
          email: email,
          institution: institution,
          course: course,
          phone: phone,
          qualifications: qualifications,
          password: hashedPassword,
          photo: processedPhoto,
        },
      },
      { new: true }
    ); // Ensures the updated document is returned

    if (!updatedTutor) {
      return res.status(404).json({ error: "Tutor not found" });
    }

    // Return the updated tutor directly from the update operation
    res.status(201).json(updatedTutor);
  } catch (error) {
    console.error("Error updating tutor:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Email Sending Function
router.post("/send-email", async (req, res) => {
  const { tutorEmail, userEmail, selectedValue, userName, tutorname } = req.body;

  try {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Email message details
    const mailOptions = {
      from: userEmail,
      to: tutorEmail,
      subject: `Tutoring Session Request: ${selectedValue}`,
      text: `Hi ${tutorname}, ${userName} has requested a ${selectedValue} tutoring session with you. Kindly reach out.`,
    };

    // Attempt to send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to: ", tutorEmail);
    return res.status(200).send({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email: ", error.message);
    return res.status(500).send({ message: "Error sending email", error: error.message });
  }
});

module.exports = router;
