const Meeting = require("../models/Meeting.js");
const { v4: uuidv4 } = require("uuid");
const createMeeting = async (req, res) => {
  try {
    const { hostEmail } = req.body;
    const meetingId = uuidv4();

    const meeting = new Meeting({
      meetingId,
      hostEmail,
      participants: [{ email: hostEmail, joinedAt: new Date() }],
    });

    await meeting.save();

    res.json({
      sucess: true,
      meetingId,
      message: "Meeting created successfully",
    });
  } catch (error) {
    res.status(500).json({
      sucess: false,
      message: "Error creating meeting",
    });
  }
};
const validateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({
      meetingId,
      active: true,
    });

    if (!meeting) {
      return res.status(404).json({
        sucess: false,
        message: "Meeting not found or has ended",
      });
    }
    res.json({
      sucess: true,
      meetingId: meeting.meetingId,
      hostEmail: meeting.hostEmail,
    });
  } catch (error) {
    res.status(500).json({
      sucess: false,
      message: "Error validating meeting",
    });
  }
};
module.exports = {
  createMeeting,
  validateMeeting,
};
