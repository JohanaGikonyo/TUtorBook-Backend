const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../models/message");

router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "name photo")
      .populate("recipient", "name photo")
      .sort({ createdAt: -1 });

    const chatPartners = {};

    messages.forEach((message) => {
      const otherUserId =
        message.sender._id.toString() === userId ? message.recipient._id.toString() : message.sender._id.toString();

      if (!chatPartners[otherUserId]) {
        const otherUser = message.sender._id.toString() === userId ? message.recipient : message.sender;

        chatPartners[otherUserId] = {
          userId: otherUserId,
          name: otherUser.name,
          photo: otherUser.photo,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
        };
      }
    });

    const chatList = Object.values(chatPartners).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    res.json(chatList);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
