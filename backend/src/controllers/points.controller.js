const asyncHandler = require('express-async-handler');
const pointsService = require('../services/points.service');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// POST /api/points/adjust  { userId, amount, reason }  (admin only)
const adjust = asyncHandler(async (req, res) => {
  const { userId, amount, reason } = req.body;
  if (!userId || typeof amount !== 'number') {
    throw ApiError.badRequest('userId and numeric amount are required');
  }

  const tx = await pointsService.adjustPoints({ userId, amount, reason, grantedById: req.user.id });

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'POINTS_ADJUST',
      targetType: 'User',
      targetId: userId,
      metadata: { amount, reason },
    },
  });

  res.status(201).json({ transaction: tx });
});

// GET /api/points/history/:userId (admin, or self)
const history = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
    throw ApiError.forbidden();
  }
  const transactions = await prisma.pointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ transactions });
});

module.exports = { adjust, history };
