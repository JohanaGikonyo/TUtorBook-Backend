const express = require("express");
const { addComment, deleteComment, getComments } = require("../controllers/comment.js");
const { verifyToken } = require("../verifyToken.js");
const router = express.Router();

router.post("/comments/:id/addComment", verifyToken, addComment);
router.delete("/:id", deleteComment);
router.get("/comments/:id/getComment", getComments);

module.exports = router;
