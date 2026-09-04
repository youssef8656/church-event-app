const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const eventService = require('../services/event.service');
const ApiError = require('../utils/ApiError');
const pointsService = require('../services/points.service');

// GET /api/teams?eventDayId=... (defaults to current day)
const list = asyncHandler(async (req, res) => {
  const eventDayId = req.query.eventDayId || (await eventService.getCurrentEventDay()).id;
  const teams = await prisma.team.findMany({
    where: { eventDayId },
    include: { assignments: { include: { user: { select: { id: true, fullName: true } } } } },
  });
  res.json({ teams });
});

// POST /api/teams (admin)
const create = asyncHandler(async (req, res) => {
  const { eventDayId, name, colorHex } = req.body;
  const team = await prisma.team.create({ data: { eventDayId, name, colorHex } });
  res.status(201).json({ team });
});

// PUT /api/teams/:id (admin) — rename / recolor
const update = asyncHandler(async (req, res) => {
  const { name, colorHex } = req.body;
  const team = await prisma.team.update({
    where: { id: req.params.id },
    data: { ...(name !== undefined && { name }), ...(colorHex !== undefined && { colorHex }) },
  });
  res.json({ team });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.team.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// POST /api/teams/:id/assign  { userId }  — assign/reassign a user to this team for its day
const assign = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const team = await prisma.team.findUnique({ where: { id: req.params.id } });
  if (!team) throw ApiError.notFound('Team not found');

  const assignment = await prisma.teamAssignment.upsert({
    where: { userId_eventDayId: { userId, eventDayId: team.eventDayId } },
    update: { teamId: team.id },
    create: { userId, eventDayId: team.eventDayId, teamId: team.id },
  });
  res.json({ assignment });
});

// POST /api/teams/bulk-assign  { eventDayId, teamId, userIds: [] }
const bulkAssign = asyncHandler(async (req, res) => {
  const { eventDayId, teamId, userIds } = req.body;
  if (!Array.isArray(userIds)) throw ApiError.badRequest('userIds must be an array');

  await prisma.$transaction(
    userIds.map((userId) =>
      prisma.teamAssignment.upsert({
        where: { userId_eventDayId: { userId, eventDayId } },
        update: { teamId },
        create: { userId, eventDayId, teamId },
      })
    )
  );
  res.json({ message: `${userIds.length} users assigned` });
});

// POST /api/teams/:id/points/adjust  { amount, reason }  (admin) — a
// completely independent ledger from individual points; never derived
// from or affected by member point totals.
const adjustPoints = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (typeof amount !== 'number') throw ApiError.badRequest('amount must be a number');

  const team = await prisma.team.findUnique({ where: { id: req.params.id } });
  if (!team) throw ApiError.notFound('Team not found');

  const tx = await pointsService.adjustTeamPoints({ teamId: req.params.id, amount, reason, grantedById: req.user.id });

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'TEAM_POINTS_ADJUST',
      targetType: 'Team',
      targetId: req.params.id,
      metadata: { amount, reason, teamName: team.name },
    },
  });

  res.status(201).json({ transaction: tx });
});

// GET /api/teams/:id/points/history (admin)
const pointsHistory = asyncHandler(async (req, res) => {
  const transactions = await pointsService.getTeamPointsHistory(req.params.id);
  res.json({ transactions });
});

module.exports = { list, create, update, remove, assign, bulkAssign, adjustPoints, pointsHistory };
