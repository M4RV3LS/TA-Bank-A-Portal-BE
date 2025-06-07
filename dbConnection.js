// BankA/backend/dbConnection.js
const mysql = require("mysql");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // your MySQL root/pass
  database: "banka_portal", // <-- Bank A’s DB
  connectionLimit: 10,
  charset: "utf8mb4",
});

connection.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL Pool Error:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL banka_portal");
  conn.release();
});

module.exports = connection;
