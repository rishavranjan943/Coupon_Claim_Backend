const Coupon = require("../models/Coupon");

exports.preventAbuse = async (req, res, next) => {
  const userIP = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const couponId = req.params.id;

  try {
    console.log(`Checking cooldown for IP: ${userIP}, Coupon ID: ${couponId}`);
    
    const coupon = await Coupon.findById(couponId);
    
    if (!coupon) {
      console.log(`Coupon not found: ${couponId}`);
      return res.status(404).json({ error: "Coupon not found" });
    }

    if (!coupon.enabled) {
      console.log(`Coupon ${couponId} is disabled`);
      return res.status(400).json({ error: "Coupon is not available" });
    }

    // Check if IP exists in claim history
    const userClaims = coupon.claimedBy.filter(claim => claim.ip === userIP);
    console.log(`Found ${userClaims.length} previous claims for IP: ${userIP}`);
    
    if (userClaims.length > 0) {
      // Get the most recent claim
      const lastClaim = userClaims[userClaims.length - 1];
      const lastClaimTime = new Date(lastClaim.timestamp).getTime();
      const currentTime = Date.now();
      const cooldownPeriodMs = coupon.cooldownPeriod * 60 * 1000; // Convert minutes to milliseconds

      console.log(`Last claim time: ${new Date(lastClaimTime).toISOString()}`);
      console.log(`Current time: ${new Date(currentTime).toISOString()}`);
      console.log(`Cooldown period: ${coupon.cooldownPeriod} minutes (${cooldownPeriodMs}ms)`);

      // Check if we're still within cooldown period
      const timeSinceLastClaim = currentTime - lastClaimTime;
      console.log(`Time since last claim: ${timeSinceLastClaim}ms`);

      if (timeSinceLastClaim < cooldownPeriodMs) {
        const remainingTimeMs = cooldownPeriodMs - timeSinceLastClaim;
        const remainingMinutes = Math.ceil(remainingTimeMs / (60 * 1000));
        
        console.log(`Cooldown active. Remaining time: ${remainingMinutes} minutes`);
        
        return res.status(429).json({
          error: `You must wait ${remainingMinutes} minutes before claiming this coupon again.`,
          lastClaimTime: lastClaim.timestamp,
          cooldownPeriod: coupon.cooldownPeriod,
          remainingMinutes: remainingMinutes
        });
      } else {
        console.log(`Cooldown period has expired. Allowing claim.`);
      }
    } else {
      console.log(`No previous claims found for IP: ${userIP}. Allowing claim.`);
    }
    req.userIP = userIP;
    next();
  } catch (error) {
    console.error("Error in preventAbuse middleware:", error);
    res.status(500).json({ error: "Error checking cooldown period" });
  }
};
