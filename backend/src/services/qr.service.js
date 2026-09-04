const QRCode = require('qrcode');
const sharp = require('sharp');

/**
 * Renders a PNG buffer containing the user's name above their QR code.
 * The QR payload is the opaque `qrToken` (a random UUID), never the
 * user's id/email/name — the backend resolves the token to a user at
 * scan time, so the code itself carries no personal information.
 *
 * Uses `sharp` (ships prebuilt binaries for all common platforms, unlike
 * node-canvas which needs system libcairo/libpango present at deploy time)
 * to rasterize an SVG (name text) composited over the QR PNG.
 */
async function generateQrPng(qrToken, displayName) {
  const qrBuffer = await QRCode.toBuffer(qrToken, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 600,
  });

  const width = 640;
  const nameAreaHeight = 90;
  const qrSize = 600;
  const height = nameAreaHeight + qrSize + 20;

  const safeName = escapeXml(truncate(displayName, 28));
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff" />
      <text
        x="50%" y="${nameAreaHeight / 2 + 12}"
        font-family="sans-serif" font-size="34" font-weight="700"
        fill="#111111" text-anchor="middle"
      >${safeName}</text>
    </svg>
  `;

  const svgBuffer = Buffer.from(svg);
  const qrX = Math.round((width - qrSize) / 2);

  const png = await sharp(svgBuffer)
    .composite([{ input: qrBuffer, top: nameAreaHeight, left: qrX }])
    .png()
    .toBuffer();

  return png;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { generateQrPng };
