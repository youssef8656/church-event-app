const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const eventService = require('../services/event.service');
const ApiError = require('../utils/ApiError');

// GET /api/admin/users?search=&role=
const listUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const users = await prisma.user.findMany({
    where: {
      ...(role && { role }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    select: { id: true, fullName: true, email: true, role: true, emailVerified: true, createdAt: true },
    orderBy: { fullName: 'asc' },
  });
  res.json({ users });
});

// PATCH /api/admin/users/:id/role  { role }
// This is the ONLY path that can change a role, and it requires an
// already-authenticated ADMIN — a user can never set their own role via
// registration or profile-update payloads.
const setRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['MEMBER', 'SERVANT', 'ADMIN'].includes(role)) throw ApiError.badRequest('Invalid role');

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });

  await prisma.auditLog.create({
    data: { actorId: req.user.id, action: 'USER_ROLE_CHANGE', targetType: 'User', targetId: user.id, metadata: { role } },
  });

  res.json({ user: { id: user.id, fullName: user.fullName, role: user.role } });
});

// GET /api/admin/permissions — list all definable permission keys
const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await prisma.permission.findMany();
  res.json({ permissions });
});

// POST /api/admin/users/:id/permissions  { permissionKey, scopeType?, scopeId? }
const grantPermission = asyncHandler(async (req, res) => {
  const { permissionKey, scopeType, scopeId } = req.body;
  const permission = await prisma.permission.upsert({
    where: { key: permissionKey },
    update: {},
    create: { key: permissionKey },
  });

  const grant = await prisma.userPermission.create({
    data: {
      userId: req.params.id,
      permissionId: permission.id,
      scopeType: scopeType || null,
      scopeId: scopeId || null,
      grantedById: req.user.id,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: req.user.id, action: 'PERMISSION_GRANT', targetType: 'User', targetId: req.params.id, metadata: { permissionKey, scopeType, scopeId } },
  });

  res.status(201).json({ grant });
});

// DELETE /api/admin/users/:id/permissions/:grantId
const revokePermission = asyncHandler(async (req, res) => {
  await prisma.userPermission.delete({ where: { id: req.params.grantId } });
  await prisma.auditLog.create({
    data: { actorId: req.user.id, action: 'PERMISSION_REVOKE', targetType: 'User', targetId: req.params.id },
  });
  res.status(204).send();
});

// GET /api/admin/users/:id/permissions
const getUserPermissions = asyncHandler(async (req, res) => {
  const grants = await prisma.userPermission.findMany({
    where: { userId: req.params.id },
    include: { permission: true },
  });
  res.json({ grants });
});

// GET /api/admin/dashboard — headline stats for the admin landing page
const dashboardStats = asyncHandler(async (req, res) => {
  const currentDay = await eventService.getCurrentEventDay();
  const todayStart = new Date(currentDay.date);
  const todayEnd = new Date(currentDay.date);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    attendanceToday,
    totalCheckIns,
    totalPointsRow,
    teamCount,
    roomCount,
    activeLeagues,
    pendingTasks,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'MEMBER' } }),
    prisma.attendance.count({ where: { checkInAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.attendance.count(),
    prisma.pointsTransaction.aggregate({ _sum: { amount: true } }),
    prisma.team.count({ where: { eventDayId: currentDay.id } }),
    prisma.room.count(),
    prisma.league.count({ where: { status: { in: ['UPCOMING', 'OPEN', 'IN_PROGRESS'] } } }),
    prisma.taskAssignment.count({ where: { status: 'PENDING' } }),
  ]);

  res.json({
    totalUsers,
    attendanceToday,
    totalCheckIns,
    totalPoints: totalPointsRow._sum.amount || 0,
    teamCount,
    roomCount,
    activeLeagues,
    pendingTasks,
    eventDay: currentDay,
  });
});

// DELETE /api/admin/users/:id — cascades to their attendance, points,
// tasks, etc. via the schema's onDelete: Cascade relations. An admin can
// never delete their own account through this endpoint.
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('User not found');

  await prisma.user.delete({ where: { id: req.params.id } });

  await prisma.auditLog.create({
    data: { actorId: req.user.id, action: 'USER_DELETE', targetType: 'User', targetId: req.params.id, metadata: { email: user.email } },
  });

  res.status(204).send();
});

module.exports = {
  listUsers,
  setRole,
  deleteUser,
  listPermissions,
  grantPermission,
  revokePermission,
  getUserPermissions,
  dashboardStats,
};
