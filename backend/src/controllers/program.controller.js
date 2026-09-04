const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// GET /api/program — full 3-day program, grouped by day for the Program page.
const list = asyncHandler(async (req, res) => {
  const eventDays = await prisma.eventDay.findMany({
    orderBy: { dayNumber: 'asc' },
    include: { programItems: { orderBy: [{ sortOrder: 'asc' }, { time: 'asc' }] } },
  });
  res.json({ eventDays });
});

const create = asyncHandler(async (req, res) => {
  const { eventDayId, time, title, location, description, sortOrder } = req.body;
  const item = await prisma.programItem.create({
    data: { eventDayId, time: new Date(time), title, location, description, sortOrder: sortOrder ?? 0 },
  });
  res.status(201).json({ item });
});

const update = asyncHandler(async (req, res) => {
  const { time, title, location, description, sortOrder } = req.body;
  const item = await prisma.programItem.update({
    where: { id: req.params.id },
    data: {
      ...(time !== undefined && { time: new Date(time) }),
      ...(title !== undefined && { title }),
      ...(location !== undefined && { location }),
      ...(description !== undefined && { description }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  res.json({ item });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.programItem.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, create, update, remove };
