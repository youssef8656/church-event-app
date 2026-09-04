const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// GET /api/notifications
const list = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ notifications });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true },
  });
  res.json({ message: 'Marked as read' });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: 'All marked as read' });
});

module.exports = { list, markRead, markAllRead };
