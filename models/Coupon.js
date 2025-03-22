const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  assigned: { type: Boolean, default: false },
  cooldownPeriod: { type: Number, default: 10 },
  enabled: { type: Boolean, default: true },
  claimedBy: [{ ip: String, timestamp: Date }],
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
});

module.exports = mongoose.model("Coupon", CouponSchema);
