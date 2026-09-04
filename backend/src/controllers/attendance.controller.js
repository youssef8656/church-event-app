const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const attendanceService = require('../services/attendance.service');
const { generateQrPng } = require('../services/qr.service');
const ApiError = require('../utils/ApiError');

// GET /api/attendance/my-qr.png — the logged-in user's own QR, as a
// downloadable PNG with their name burned into the image.
const myQrPng = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const png = await generateQrPng(user.qrToken, user.fullName);
  res.set('Content-Type', 'image/png');
  res.set('Content-Disposition', `attachment; filename="qr-${user.fullName.replace(/\s+/g, '_')}.png"`);
  res.send(png);
});

// GET /api/attendance/my-history
const myHistory = asyncHandler(async (req, res) => {
  const history = await attendanceService.getUserAttendanceHistory(req.user.id);
  res.json({ history });
});

// POST /api/attendance/scan  { qrToken, meetingId }
// Used by the admin/servant scanner UI. Requires attendance:scan permission.
const scan = asyncHandler(async (req, res) => {
  const { qrToken, meetingId } = req.body;
  if (!qrToken || !meetingId) throw ApiError.badRequest('qrToken and meetingId are required');

  const result = await attendanceService.checkIn({
    qrToken,
    meetingId,
    scannedById: req.user.id,
  });
  res.json(result);
});

module.exports = { myQrPng, myHistory, scan };
