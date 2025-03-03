// calls routes.js
const express = require("express");
const Call = require("../models/Call");

const router = express.Router();

// post api calls
router.post("/", async (req, res) => {
  try {
    const { caller, receiver, type } = req.body;
    const call = new Call({
      caller,
      receiver,
      type,
    });
    await call.save();
    res.status(201).json(call);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
