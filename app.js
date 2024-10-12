const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// Serve static files from 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/userImage", express.static("userImage"));

// Database connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/tutors", require("./routes/tutors"));
app.use("/api/images", require("./routes/images"));
app.use("/api/interactions", require("./routes/interactions"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Create HTTP server and setup Socket.IO
const server = http.createServer(app);
const io = socketIo(server);

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Pass the Socket.IO instance to the app
app.set("socketio", io);
app.get("/", (req, res) => {
  res.json({ message: "Server Nicely running!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
