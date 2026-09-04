const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// GET /api/admin/audit-log?targetType=&actorId=&limit=
const list = asyncHandler(async (req, res) => {
  const { targetType, actorId } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(targetType && { targetType }),
      ...(actorId && { actorId }),
    },
    include: { actor: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json({ logs });
});

module.exports = { list };
