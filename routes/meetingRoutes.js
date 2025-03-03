const express = require("express");
const { createMeeting, validateMeeting } = require("../controllers/meetingController.js");
const router = express.Router();

router.post("/create", createMeeting);
router.get("/validate/:meetingId", validateMeeting);

module.exports = router;
