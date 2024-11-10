const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// Setup nodemailer transporter for email verification
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register a new user
exports.register = async (req, res) => {
  const { username, firstName, lastName, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({
      username,
      firstName,
      lastName,
      password: await bcrypt.hash(password, 10),
    });

    await user.save();

    // Send activation email
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const url = `http://localhost:5000/api/auth/activate/${token}`;
    await transporter.sendMail({
      to: user.username,
      subject: "Account Activation",
      html: `<p>Click <a href="${url}">here</a> to activate your account.</p>`,
    });

    res.json({ msg: "Registration successful, please check your email to activate your account" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activate user account
exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isActive = true;
    await user.save();

    res.json({ msg: "Account activated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Invalid or expired token" });
  }
};

// Login a user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (!user.isActive) return res.status(400).json({ msg: "Account not activated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const url = `http://localhost:5000/api/auth/reset-password/${token}`;

    await transporter.sendMail({
      to: user.username,
      subject: "Password Reset",
      html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
    });

    res.json({ msg: "Password reset link sent to email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Invalid or expired token" });
  }
};
