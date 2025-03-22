const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const router = express.Router();


router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });

  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return res.status(401).json({ error: "Invalid Credentials" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.cookie("token", token, { httpOnly: true }).json({ success: true, message: "Login successful!" });
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully!" });
  });
  
module.exports = router;
