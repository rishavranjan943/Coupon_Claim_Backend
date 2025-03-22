const express = require("express");
const Coupon = require("../models/Coupon");
const { authAdmin } = require("../middlewares/auth");
const { preventAbuse } = require("../middlewares/abusePrevention");
const router = express.Router();


router.get("/available", async (req, res) => {
    try {
  
      const allCoupons = await Coupon.find({enabled:true});
  
      if (!allCoupons || allCoupons.length === 0) {
        return res.status(404).json({ error: "No coupons available" });
      }
  
      res.json(allCoupons);
    } catch (error) {
      console.error("Error fetching all coupons:", error);
      res.status(500).json({ error: "Error fetching coupons" });
    }
  });
  

 
const sessionCookieName = "couponSession";

const getSessionId = (req, res) => {
  if (!req.cookies[sessionCookieName]) {
    const sessionId = Math.random().toString(36).substr(2, 9);
    res.cookie(sessionCookieName, sessionId, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    return sessionId;
  }
  return req.cookies[sessionCookieName];
};

router.post("/claim/:id", preventAbuse, async (req, res) => {
  const userIp = req.userIP; 
  const couponId = req.params.id;

  try {
    const coupon = await Coupon.findById(couponId);

    if (!coupon || !coupon.enabled) {
      return res.status(400).json({ error: "Coupon unavailable" });
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return res.status(400).json({ error: "Coupon is not currently valid" });
    }

    coupon.claimedBy.push({ ip: userIp, timestamp: new Date() });
    await coupon.save();

    res.json({ success: true, coupon: coupon.code });
  } catch (error) {
    console.error("Error claiming coupon:", error);
    res.status(500).json({ error: "Error claiming coupon" });
  }
});


router.get("/list", authAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: "Error fetching coupons" });
  }
});

router.post("/add", authAdmin, async (req, res) => {
    try {
      const { code, cooldownPeriod, description, startDate, endDate } = req.body;
  
      if (!code || !cooldownPeriod || !description || !startDate || !endDate) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      const today = new Date().setHours(0, 0, 0, 0);
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(0, 0, 0, 0);
  
      if (start < today) {
        return res.status(400).json({ error: "Start Date cannot be in the past" });
      }
  
      if (start >= end) {
        return res.status(400).json({ error: "Start Date must be before End Date" });
      }
  
      const newCoupon = new Coupon({ code, cooldownPeriod, enabled: true, description, startDate, endDate });
      await newCoupon.save();
      res.json({ success: true, message: "Coupon added successfully!" });
    } catch (error) {
      console.error("Error adding coupon:", error);
      res.status(500).json({ error: "Error adding coupon" });
    }
  });
  
  
  

  router.put("/update/:id", authAdmin, async (req, res) => {
    try {
      const { code, cooldownPeriod, description, startDate, endDate } = req.body;
      const updatedCoupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        { code, cooldownPeriod, description, startDate, endDate },
        { new: true }
      );
  
      if (!updatedCoupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
  
      res.json({ success: true, message: "Coupon updated successfully!", coupon: updatedCoupon });
    } catch (error) {
      res.status(500).json({ error: "Error updating coupon" });
    }
  });
  
  

  router.put("/toggle/:id", authAdmin, async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
  
      coupon.enabled = !coupon.enabled;
      await coupon.save();
  
      res.json({ success: true, message: `Coupon ${coupon.enabled ? "Enabled" : "Disabled"} successfully!`, coupon });
    } catch (error) {
      res.status(500).json({ error: "Error toggling coupon status" });
    }
  });
  
  


router.get("/claims", authAdmin, async (req, res) => {
  try {
    const claims = await Coupon.find({}, "code claimedBy cooldownPeriod startDate endDate");
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: "Error fetching claim history" });
  }
});

module.exports = router;
