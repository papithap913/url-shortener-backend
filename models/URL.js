const mongoose = require("mongoose");

const URLSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  clickCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("URL", URLSchema);
