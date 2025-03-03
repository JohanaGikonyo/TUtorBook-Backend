const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Message = require("../models/message");
router.post("/post_message", async (req, res) => {
  const { recipient, sender, content } = req.body;
  try {
    const newMessage = new Message({
      recipient,
      sender,
      content,
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/get_message", async (req, res) => {
  const { recipient, sender } = req.body;
  try {
    let query = { recipient: recipient };

    if (sender) {
      query.sender = sender;
    }

    const messages = await Message.find(query);

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
