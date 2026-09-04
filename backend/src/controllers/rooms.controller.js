const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// GET /api/rooms — with current occupancy
const list = asyncHandler(async (req, res) => {
  const rooms = await prisma.room.findMany({
    include: { assignments: { where: { active: true }, include: { user: { select: { id: true, fullName: true } } } } },
    orderBy: { label: 'asc' },
  });
  res.json({ rooms });
});

// POST /api/rooms (admin)
const create = asyncHandler(async (req, res) => {
  const { label, capacity } = req.body;
  const room = await prisma.room.create({ data: { label, capacity } });
  res.status(201).json({ room });
});

const update = asyncHandler(async (req, res) => {
  const { label, capacity } = req.body;
  const room = await prisma.room.update({
    where: { id: req.params.id },
    data: { ...(label !== undefined && { label }), ...(capacity !== undefined && { capacity }) },
  });
  res.json({ room });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.room.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// POST /api/rooms/:id/assign  { userId } — deactivates any prior active
// assignment for this user before creating the new one, preserving history.
const assign = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const roomId = req.params.id;

  await prisma.$transaction([
    prisma.roomAssignment.updateMany({
      where: { userId, active: true },
      data: { active: false },
    }),
    prisma.roomAssignment.create({ data: { userId, roomId, active: true } }),
  ]);
  res.status(201).json({ message: 'Assigned' });
});

module.exports = { list, create, update, remove, assign };
