// bank-portal/bank-a/backend/gateaway/middleware/auth.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config"); // This should be process.env.GATEWAY_JWT_SECRET_FOR_INTERBANK_AUTH

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  console.log("[AUTH MW Bank A] Received Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[AUTH MW Bank A] Authorization header missing or malformed.");
    return res
      .status(401)
      .json({ error: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.warn("[AUTH MW Bank A] Token not found after 'Bearer '.");
    return res.status(401).json({ error: "Token not found" });
  }

  console.log("[AUTH MW Bank A] Received token:", token);
  // Be cautious logging secrets, even parts of them, in a production environment.
  // For local debugging, this can be very helpful.
  console.log(
    "[AUTH MW Bank A] Verifying with JWT_SECRET (first 10 chars):",
    JWT_SECRET ? JWT_SECRET.substring(0, 10) + "..." : "UNDEFINED OR EMPTY"
  );

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.bankBadge = decoded; // Attach the decoded payload to the request object
    console.log(
      "[AUTH MW Bank A] Badge verified successfully. Payload:",
      decoded
    );
    next();
  } catch (e) {
    console.error("[AUTH MW Bank A] Full error verifying badge:", e); // Log the full error object

    if (e.name === "JsonWebTokenError") {
      console.error("[AUTH MW Bank A] JWT Error:", e.message);
    } else if (e.name === "TokenExpiredError") {
      console.error(
        "[AUTH MW Bank A] Token Expired Error:",
        e.message,
        "Expired at:",
        e.expiredAt
      );
    }
    res.status(401).json({ error: "Invalid badge" });
  }
};
