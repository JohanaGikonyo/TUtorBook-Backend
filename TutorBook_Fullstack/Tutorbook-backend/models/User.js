// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  day: { type: String },
  month: { type: String },
  year: { type: String },
  institution: { type: String },
  graduationYear: { type: String },
  course: { type: String },
  password: { type: String, required: true },
  photo: { type: String }
});

module.exports = mongoose.model('User', userSchema);
