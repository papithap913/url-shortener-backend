const express = require("express");
const { shortenURL, redirectURL } = require("../controllers/urlController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/shorten", authMiddleware, shortenURL);
router.get("/:shortUrl", redirectURL);

module.exports = router;
