const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Storage abstraction so the provider can change later without touching
 * controllers. Each function returns { fileUrl, fileKey }.
 *
 * Current implementation: local disk, served statically from /uploads.
 * To swap to S3: implement the same two functions against the AWS SDK
 * using env.storage.s3* config, and flip STORAGE_PROVIDER=s3 — nothing
 * else in the app needs to change.
 */

function ensureLocalDir() {
  const dir = path.resolve(env.storage.localDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function saveFile({ buffer, originalName, mimeType }) {
  if (env.storage.provider === 's3') {
    return saveToS3({ buffer, originalName, mimeType });
  }
  return saveToLocal({ buffer, originalName });
}

async function saveToLocal({ buffer, originalName }) {
  const dir = ensureLocalDir();
  const ext = path.extname(originalName) || '';
  const key = `${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(dir, key), buffer);
  return {
    fileKey: key,
    fileUrl: `/uploads/${key}`, // served by express.static in app.js
  };
}

async function deleteFile(fileKey) {
  if (env.storage.provider === 's3') {
    return deleteFromS3(fileKey);
  }
  const dir = ensureLocalDir();
  const filePath = path.join(dir, fileKey);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// --- S3 stubs: implement with @aws-sdk/client-s3 when ready to switch ---
async function saveToS3() {
  throw new Error('S3 storage provider not yet implemented. Set STORAGE_PROVIDER=local for now.');
}
async function deleteFromS3() {
  throw new Error('S3 storage provider not yet implemented.');
}

module.exports = { saveFile, deleteFile };
