// bank-portal/bank-a/backend/utils/cryptoUtils.js
const crypto = require("crypto");

const AES_ALGORITHM = "aes-256-cbc";

function aesEncrypt(text, keyHex) {
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "Invalid key length for AES-256. Must be 32 bytes (64 hex chars)."
    );
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function aesDecrypt(encryptedTextWithIv, keyHex) {
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "Invalid key length for AES-256. Must be 32 bytes (64 hex chars)."
    );
  }
  const textParts = encryptedTextWithIv.split(":");
  if (textParts.length !== 2) {
    throw new Error("Invalid encrypted text format. Expected IV:Ciphertext.");
  }
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = textParts.join(":");
  if (iv.length !== 16) {
    throw new Error("Invalid IV length. Must be 16 bytes for AES-CBC.");
  }
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { aesEncrypt, aesDecrypt };
