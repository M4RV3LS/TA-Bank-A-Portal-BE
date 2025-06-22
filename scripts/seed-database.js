// seed-database.js
const mysql = require("mysql2/promise");
const fs = require("fs");

// --- Configuration ---
const dbConfigA = {
  host: "localhost",
  user: "root", // Replace with your user
  password: "", // Replace with your password
  database: "banka_portal",
};

const dbConfigB = {
  host: "localhost",
  user: "root", // Replace with your user
  password: "", // Replace with your password
  database: "bankb_portal",
};

// --- Seeding Functions ---

/**
 * Creates 'verified' requests in Bank A's DB, ready for the /send-to-chain test.
 */
async function seedForSendToChain(count) {
  console.log(`Seeding ${count} 'verified' requests for Bank A...`);
  const conn = await mysql.createConnection(dbConfigA);
  const requestIds = [];

  // This client ID must exist on-chain from a previous test.
  const onChainClientId = 19;

  // You need valid KTP/KYC data for hashing.
  const sampleKtp = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."; // Use a real (but small) data URI
  const sampleKyc = "data:application/pdf;base64,JVBERi0xLjc..."; // Use a real (but small) data URI

  for (let i = 0; i < count; i++) {
    const [result] = await conn.execute(
      `INSERT INTO user_kyc_request (client_id, customer_name, status_kyc, status_request, customer_ktp, customer_kyc) VALUES (?, ?, 'verified', 'update', ?, ?)`,
      [onChainClientId, `Load Test User ${i}`, sampleKtp, sampleKyc]
    );
    requestIds.push(result.insertId);
  }

  fs.writeFileSync(
    "./send-to-chain-ids.csv",
    "requestId\n" + requestIds.join("\n")
  );
  console.log(`✅ Done. Saved ${count} IDs to send-to-chain-ids.csv`);
  await conn.end();
}

/**
 * Creates 'reuse_kyc' requests in Bank B's DB, ready for the /pay test.
 */
async function seedForPay(count) {
  console.log(`Seeding ${count} 'reuse_kyc' requests for Bank B...`);
  const conn = await mysql.createConnection(dbConfigB);
  const requestIds = [];
  const onChainClientId = 19; // Must match a client with a record on the blockchain

  for (let i = 0; i < count; i++) {
    const [result] = await conn.execute(
      `INSERT INTO user_kyc_request (client_id, customer_name, status_request, status_kyc, home_bank_code) VALUES (?, ?, 'reuse_kyc', 'submitted', 'BANK_A')`,
      [onChainClientId, `Reuse Pay User ${i}`]
    );
    requestIds.push(result.insertId);
  }

  fs.writeFileSync("./pay-ids.csv", "requestId\n" + requestIds.join("\n"));
  console.log(`✅ Done. Saved ${count} IDs to pay-ids.csv`);
  await conn.end();
}

/**
 * Creates 'paid' reuse requests in Bank B's DB, ready for the /fetch-and-verify-reuse test.
 */
async function seedForCheckAndReuse(count) {
  console.log(`Seeding ${count} 'paid' reuse requests for Bank B...`);
  const conn = await mysql.createConnection(dbConfigB);
  const requestIds = [];
  const onChainClientId = 19; // Must match a client with a record on the blockchain

  for (let i = 0; i < count; i++) {
    const [result] = await conn.execute(
      `INSERT INTO user_kyc_request (client_id, customer_name, status_request, status_kyc, home_bank_code) VALUES (?, ?, 'reuse_kyc', 'paid', 'BANK_A')`,
      [onChainClientId, `Check Reuse User ${i}`]
    );
    requestIds.push(result.insertId);
  }

  fs.writeFileSync(
    "./check-reuse-ids.csv",
    "requestId\n" + requestIds.join("\n")
  );
  console.log(`✅ Done. Saved ${count} IDs to check-reuse-ids.csv`);
  await conn.end();
}

// --- Main Execution Logic ---
const [, , scenario, countStr] = process.argv;
const count = parseInt(countStr) || 100;

async function main() {
  if (scenario === "sendToChain") {
    await seedForSendToChain(count);
  } else if (scenario === "pay") {
    await seedForPay(count);
  } else if (scenario === "checkAndReuse") {
    await seedForCheckAndReuse(count);
  } else {
    console.log("Usage: node seed-database.js <scenario> [count]");
    console.log("Scenarios: sendToChain, pay, checkAndReuse");
  }
}

main().catch(console.error);
