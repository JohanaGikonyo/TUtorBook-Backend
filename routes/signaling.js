const express = require("express");
const router = express.Router();
const signalingController = require("../controllers/signalingController");

// define api routes related to signaling
router.post("/offer", signalingController.handleOffer);
router.post("/offer", signalingController.handleAnswer);
router.post("/offer", signalingController.handleIceCandidate);

module.exports = router;
