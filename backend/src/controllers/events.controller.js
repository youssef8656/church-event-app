const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// GET /api/events — list events with their days (usually just one active event)
const list = asyncHandler(async (req, res) => {
  const events = await prisma.event.findMany({
    include: { eventDays: { orderBy: { dayNumber: 'asc' } } },
    orderBy: { startDate: 'desc' },
  });
  res.json({ events });
});

// POST /api/events (admin) — creates the event AND its N days in one call
// { name, startDate, endDate, timezone, days: 3 }
const create = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, timezone, days } = req.body;
  if (!days || days < 1) throw ApiError.badRequest('days must be at least 1');

  const start = new Date(startDate);
  const event = await prisma.event.create({
    data: {
      name,
      startDate: start,
      endDate: new Date(endDate),
      timezone: timezone || 'Africa/Cairo',
      settings: {
        create: [
          { key: 'attendance.graceMinutes', value: '5' },
          { key: 'attendance.points', value: '10' },
        ],
      },
      eventDays: {
        create: Array.from({ length: days }, (_, i) => {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          return { dayNumber: i + 1, date };
        }),
      },
    },
    include: { eventDays: true },
  });

  res.status(201).json({ event });
});

// PUT /api/events/:id (admin) — rename or change dates
const update = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, timezone } = req.body;
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(timezone !== undefined && { timezone }),
    },
  });
  res.json({ event });
});

module.exports = { list, create, update };
