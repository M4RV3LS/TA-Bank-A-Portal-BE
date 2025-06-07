// File: E:\Coding\Tugas Akhir\bank-portal\bank-a\backend\gateaway\config.js

require("dotenv").config({
  // This path correctly points to the .env file in the bank-a/backend/ directory
  // when __dirname is E:\Coding\Tugas Akhir\bank-portal\bank-a\backend\gateaway
  path: require("path").resolve(__dirname, "../.env"),
});

// Optional: Add a log to confirm which .env file is being targeted
console.log(
  "[BANK A Gateway Config] Loading .env from:",
  require("path").resolve(__dirname, "../.env")
);
console.log(
  "[BANK A Gateway Config] MY_BANK_ETHEREUM_ADDRESS from env:",
  process.env.MY_BANK_ETHEREUM_ADDRESS
);

module.exports = {
  PORT: process.env.GATEWAY_PORT_BANK_A || 4100, // Use a specific env var for BANK A's port or default
  JWT_SECRET: process.env.GATEWAY_JWT_SECRET_FOR_INTERBANK_AUTH, // Should be the same shared secret
  CHAIN_RPC: process.env.RPC_URL,
  CONTRACT_ADDR: process.env.KYC_REGISTRY_ADDRESS, // Assuming same contract

  // Database connection details for BANK A's gateway (if it has its own user_profiles or other tables)
  // Adjust these if BANK A's gateway uses a different DB or credentials
  DB_HOST: process.env.DB_HOST_BANK_A || process.env.DB_HOST || "localhost",
  DB_USER: process.env.DB_USER_BANK_A || process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD_BANK_A || process.env.DB_PASSWORD || "",
  DB_NAME: process.env.GATEWAY_DB_NAME_BANK_A || "banka_portal", // Specific to BANK A

  // SQL query for BANK A's gateway (if it ever acts as a Home Bank)
  ENCRYPTED_BUNDLE_SQL: `SELECT encrypted_bundle FROM user_profiles WHERE user_id = ?`,

  // Crucial for the "Fetch from Home Bank" logic
  MY_BANK_ETHEREUM_ADDRESS: process.env.MY_BANK_ETHEREUM_ADDRESS,
  KNOWN_BANK_GATEWAYS: {
    // Add known bank gateways here. Keys shoul
    // d be lowercase Ethereum addresses.
    // Example: If Bank A's Ethereum address (its gateway identity) is '0xbankAaddress...'
    // and its gateway runs on port 4000 (for Bank A's gateway, not Bank A's main backend)
    "0x251Ae9000E8B8e70E0E62965e552e5D7519ea378": "http://localhost:5100", // Replace with actual Bank A address and its GATEWAY port
    // Add other bank gateways BANK A might need to contact
  },
};
