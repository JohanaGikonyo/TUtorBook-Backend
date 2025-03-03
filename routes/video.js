// const express = require("express");
// const multer = require("multer");
// const {
//   postVideo,
//   getFile,
//   getVideos,
//   updateVideo,
//   deleteVideo,
//   subscribe,
//   unsubscribe,
//   like,
//   dislike,
//   addView,
// } = require("../controllers/videoControllers.js");
// const { verifyToken } = require("../verifyToken.js");

// const router = express.Router();
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // create the video
// // router.post("/", verifyToken, addVideo)
// router.post("/upload", upload.single("video"), postVideo);
// router.get("/getVideos", getVideos);
// router.get("/file/:fileId", getFile);
// router.put("/updateVideo", updateVideo);
// router.delete("/deleteVideo", deleteVideo);
// router.put("/users/:id/subscribe", verifyToken, subscribe);
// router.put("/users/:id/unsubscribe", verifyToken, unsubscribe);
// router.put("/videos/:id/like", verifyToken, like);
// router.put("/videos/:id/dislike", verifyToken, dislike);
// router.put("/videos/:id/view", verifyToken, addView);

// module.exports = router;
