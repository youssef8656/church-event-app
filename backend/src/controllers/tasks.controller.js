const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// GET /api/tasks/mine
const mine = asyncHandler(async (req, res) => {
  const assignments = await prisma.taskAssignment.findMany({
    where: { userId: req.user.id },
    include: { task: true },
    orderBy: { task: { dueAt: 'asc' } },
  });
  res.json({ tasks: assignments });
});

// GET /api/tasks (admin) — all tasks with assignment summary
const list = asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({
    include: { assignments: { include: { user: { select: { id: true, fullName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ tasks });
});

// POST /api/tasks (admin) — create + assign to a list of userIds
const create = asyncHandler(async (req, res) => {
  const { title, description, points, dueAt, userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw ApiError.badRequest('userIds must be a non-empty array');
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      points: points ?? 0,
      dueAt: dueAt ? new Date(dueAt) : null,
      createdById: req.user.id,
      assignments: { create: userIds.map((userId) => ({ userId })) },
    },
    include: { assignments: true },
  });

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: '🔔 New task assigned',
      body: title,
      type: 'TASK',
      linkPath: '/profile',
    })),
  });

  res.status(201).json({ task });
});

// PATCH /api/tasks/:taskId/assignments/:userId/complete (member marks their own as done)
const markComplete = asyncHandler(async (req, res) => {
  const { taskId, userId } = req.params;
  if (userId !== req.user.id) throw ApiError.forbidden('You can only complete your own tasks');

  const assignment = await prisma.taskAssignment.update({
    where: { taskId_userId: { taskId, userId } },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
  res.json({ assignment });
});

// PATCH /api/tasks/:taskId/assignments/:userId/verify (admin verifies + awards points)
const verify = asyncHandler(async (req, res) => {
  const { taskId, userId } = req.params;

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.taskAssignment.update({
      where: { taskId_userId: { taskId, userId } },
      data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedById: req.user.id },
      include: { task: true },
    });

    if (assignment.task.points > 0) {
      await tx.pointsTransaction.create({
        data: {
          userId,
          amount: assignment.task.points,
          sourceType: 'TASK',
          reason: `Task verified: ${assignment.task.title}`,
          taskId,
        },
      });
    }
    return assignment;
  });

  res.json({ assignment: result });
});

module.exports = { mine, list, create, markComplete, verify };
