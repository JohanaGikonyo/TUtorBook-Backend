const express = require("express");
const router = express.Router();
const Connect = require("../models/connections");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// Send Connection Request
router.post("/connect", async (req, res) => {
  const { requesterId, targetId, requesterName, targetName, targetEmail, requesterEmail } = req.body;
  console.log("requester Id: ", requesterId);
  try {
    // Check if the connection request already exists
    const existingConnection = await Connect.findOne({
      requester: requesterId,
      target: targetId,
      status: "pending",
    });

    if (existingConnection) {
      return res.status(400).json({ error: "Connection request already sent" });
    }

    // Create a new connection request
    const newConnection = new Connect({
      requester: requesterId,
      target: targetId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newConnection.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    // Email message details
    const mailOptions = {
      from: requesterEmail,
      to: targetEmail,
      subject: `You have a new Connection Request`,
      text: `Hi ${targetName},${requesterName} is requesting to connect. `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: "Email sent successfully" });

    // Optionally, you can notify the target user (via email or real-time notification)
    res.status(201).json({ message: "Connection request sent successfully" });
  } catch (error) {
    console.error("Error sending connection request:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/connect", async (req, res) => {
  const { requesterId, targetIds, requesterName, requesterEmail, targetNames, targetEmails } = req.body;
  console.log("requester Id: ", requesterId);

  try {
    const results = [];
    let responseSent = false; // Flag to track if response has been sent

    for (let i = 0; i < targetIds.length; i++) {
      const targetId = targetIds[i];
      const targetName = targetNames[i];
      const targetEmail = targetEmails[i];

      try {
        const existingConnection = await Connect.findOne({
          requester: requesterId,
          target: targetId,
          status: "pending",
        });

        if (existingConnection) {
          results.push({ targetId, message: "Connection request already sent" });
          continue;
        }

        const newConnection = new Connect({
          requester: requesterId,
          target: targetId,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await newConnection.save();

        // Send the email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: requesterEmail,
          to: targetEmail,
          subject: `You have a new Connection Request`,
          text: `Hi ${targetName},\n\n${requesterName} is requesting to connect.\n\nYou can accept the connection request by clicking the link below:\n\nhttp://localhost:8081/connect/ConnectionRequests\n\nThank you!`,
        };

        await transporter.sendMail(mailOptions);
        results.push({ targetId, message: "Connection request sent successfully" });
        console.log(`Email sent successfully to ${targetEmail}`);
      } catch (error) {
        console.error(`Error sending connection request for target ${targetId}:`, error.message);
        results.push({ targetId, message: `Error sending connection request: ${error.message}` });
      }
    }

    // Send the response once, after all requests are processed
    if (!responseSent) {
      return res.status(201).json({ results });
    }
  } catch (error) {
    console.error("Error sending connection requests:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/decline", async (req, res) => {
  const { connectionId, targetId } = req.body;

  try {
    // Find the connection request
    const connection = await Connect.findOne({
      _id: connectionId,
      target: targetId,
      status: "pending",
    });

    if (!connection) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    // Update the connection status to "declined"
    connection.status = "declined";
    connection.updatedAt = new Date();
    await connection.save();

    // Optionally notify the requester that the connection was declined
    res.json({ message: "Connection request declined" });
  } catch (error) {
    console.error("Error declining connection request:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch connection requests for a user
router.get("/requests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("finding request for id: ", userId);
    const requests = await Connect.find({
      target: userId,
      status: "pending",
    }).populate("requester", "photo name email");
    console.log(requests);
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch accepted connections for the user (both where they accepted and where others accepted them)
router.get("/accepted/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch connections where the user is the target (others accepted their request)
    const acceptedByOthers = await Connect.find({
      target: userId,
      status: "accepted",
    }).populate("requester", "name email photo");

    // Fetch connections where the user is the requester (they accepted others' requests)
    const acceptedByUser = await Connect.find({
      requester: userId,
      status: "accepted",
    }).populate("target", "name email photo course phone institution");

    // Combine the two lists into one
    const acceptedConnections = [
      ...acceptedByOthers.map((conn) => conn.requester), // users who accepted the user’s request
      ...acceptedByUser.map((conn) => conn.target), // users the user accepted
    ];

    res.status(200).json({ success: true, followers: acceptedConnections });
  } catch (error) {
    console.error("Error fetching accepted connections:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Example: Backend route to check connection status
router.get("/check-connection/:requesterId/:targetId", async (req, res) => {
  const { requesterId, targetId } = req.params;

  try {
    const connection = await Connect.findOne({
      requester: requesterId,
      target: targetId,
      status: { $in: ["pending", "accepted"] },
    });

    if (connection) {
      return res.status(200).json({ exists: true, status: connection.status });
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
