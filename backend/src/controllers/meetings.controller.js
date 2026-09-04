const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const eventService = require('../services/event.service');

// GET /api/meetings?eventDayId=... (defaults to current day)
const list = asyncHandler(async (req, res) => {
  const eventDayId = req.query.eventDayId || (await eventService.getCurrentEventDay()).id;
  const meetings = await prisma.meeting.findMany({
    where: { eventDayId },
    orderBy: { startTime: 'asc' },
  });
  res.json({ meetings });
});

// POST /api/meetings (admin)
const create = asyncHandler(async (req, res) => {
  const { eventDayId, title, startTime, location, graceMinutes, attendancePoints } = req.body;
  const meeting = await prisma.meeting.create({
    data: {
      eventDayId,
      title,
      startTime: new Date(startTime),
      location,
      graceMinutes: graceMinutes ?? null,
      attendancePoints: attendancePoints ?? null,
    },
  });
  res.status(201).json({ meeting });
});

// PUT /api/meetings/:id (admin)
const update = asyncHandler(async (req, res) => {
  const { title, startTime, location, graceMinutes, attendancePoints } = req.body;
  const meeting = await prisma.meeting.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(startTime !== undefined && { startTime: new Date(startTime) }),
      ...(location !== undefined && { location }),
      ...(graceMinutes !== undefined && { graceMinutes }),
      ...(attendancePoints !== undefined && { attendancePoints }),
    },
  });
  res.json({ meeting });
});

// DELETE /api/meetings/:id (admin)
const remove = asyncHandler(async (req, res) => {
  await prisma.meeting.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, create, update, remove };
