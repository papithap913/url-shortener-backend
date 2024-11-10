const shortid = require("shortid");
const URL = require("../models/URL");

// Shorten a URL
exports.shortenURL = async (req, res) => {
  const { originalUrl } = req.body;
  
  try {
    const shortUrl = shortid.generate();
    const url = new URL({ originalUrl, shortUrl });
    await url.save();

    res.json({ originalUrl, shortUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Redirect to original URL
exports.redirectURL = async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await URL.findOne({ shortUrl });
    if (!url) return res.status(404).json({ msg: "URL not found" });

    url.clickCount += 1;
    await url.save();

    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
