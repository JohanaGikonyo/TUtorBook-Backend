const mongoose = require('mongoose');

const TutorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  institution: { type: String, required: true },
  graduationYear: { type: String, required: true },
  course: { type: String, required: true },
  password: { type: String, required: true },
  photo: { type: String },
  qualifications: { type: String }
});

module.exports = mongoose.model('Tutor', TutorSchema);
