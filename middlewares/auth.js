const jwt = require("jsonwebtoken");

exports.authAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(403).json({ error: "Access Denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid Token" });
  }
};
