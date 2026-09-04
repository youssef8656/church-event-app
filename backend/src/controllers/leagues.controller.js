const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// GET /api/leagues
const list = asyncHandler(async (req, res) => {
  const leagues = await prisma.league.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { startAt: 'asc' },
  });
  res.json({
    leagues: leagues.map((l) => ({
      ...l,
      participantCount: l._count.participants,
      availableSlots: l.maxParticipants != null ? l.maxParticipants - l._count.participants : null,
      _count: undefined,
    })),
  });
});

// GET /api/leagues/:id (with participant list)
const getOne = asyncHandler(async (req, res) => {
  const league = await prisma.league.findUnique({
    where: { id: req.params.id },
    include: { participants: { include: { user: { select: { id: true, fullName: true } } } } },
  });
  if (!league) throw ApiError.notFound('League not found');
  res.json({ league });
});

// POST /api/leagues (admin)
const create = asyncHandler(async (req, res) => {
  const { name, description, location, startAt, maxParticipants } = req.body;
  const league = await prisma.league.create({
    data: { name, description, location, startAt: startAt ? new Date(startAt) : null, maxParticipants },
  });
  res.status(201).json({ league });
});

// PUT /api/leagues/:id (admin)
const update = asyncHandler(async (req, res) => {
  const { name, description, location, startAt, maxParticipants, status, registrationOpen } = req.body;
  const league = await prisma.league.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(startAt !== undefined && { startAt: new Date(startAt) }),
      ...(maxParticipants !== undefined && { maxParticipants }),
      ...(status !== undefined && { status }),
      ...(registrationOpen !== undefined && { registrationOpen }),
    },
  });
  res.json({ league });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.league.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// POST /api/leagues/:id/join
// Prevents: joining twice (unique constraint), joining a full league,
// joining after registration closes. Uses a transaction with a fresh
// count check to avoid a race where two people fill the last slot at once.
const join = asyncHandler(async (req, res) => {
  const leagueId = req.params.id;
  const userId = req.user.id;

  await prisma.$transaction(async (tx) => {
    const league = await tx.league.findUnique({
      where: { id: leagueId },
      include: { _count: { select: { participants: true } } },
    });
    if (!league) throw ApiError.notFound('League not found');
    if (!league.registrationOpen) throw ApiError.badRequest('Registration is closed for this league');

    const existing = await tx.leagueParticipant.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (existing) throw ApiError.conflict('You have already joined this league');

    if (league.maxParticipants != null && league._count.participants >= league.maxParticipants) {
      throw ApiError.conflict('This league is full');
    }

    await tx.leagueParticipant.create({ data: { leagueId, userId } });
  });

  res.status(201).json({ message: 'Joined successfully' });
});

// DELETE /api/leagues/:id/leave (self) or /api/leagues/:id/participants/:userId (admin remove)
const leave = asyncHandler(async (req, res) => {
  const leagueId = req.params.id;
  const userId = req.params.userId || req.user.id;
  if (userId !== req.user.id && req.user.role !== 'ADMIN') throw ApiError.forbidden();

  await prisma.leagueParticipant.delete({
    where: { leagueId_userId: { leagueId, userId } },
  });
  res.status(204).send();
});

// POST /api/leagues/:id/results (admin) — record placements + award points
const recordResults = asyncHandler(async (req, res) => {
  const leagueId = req.params.id;
  const { results } = req.body; // [{ userId, result: "1st place", points: 50 }]
  if (!Array.isArray(results)) throw ApiError.badRequest('results must be an array');

  await prisma.$transaction(async (tx) => {
    for (const r of results) {
      await tx.leagueParticipant.update({
        where: { leagueId_userId: { leagueId, userId: r.userId } },
        data: { result: r.result },
      });
      if (r.points) {
        await tx.pointsTransaction.create({
          data: {
            userId: r.userId,
            amount: r.points,
            sourceType: 'LEAGUE',
            reason: r.result || 'League result',
            leagueId,
          },
        });
      }
    }
    await tx.league.update({ where: { id: leagueId }, data: { status: 'COMPLETED' } });
  });

  res.json({ message: 'Results recorded' });
});

module.exports = { list, getOne, create, update, remove, join, leave, recordResults };
