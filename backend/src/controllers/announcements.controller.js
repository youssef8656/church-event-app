const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

const list = asyncHandler(async (req, res) => {
  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { publishedAt: 'desc' }],
  });
  res.json({ announcements });
});

const create = asyncHandler(async (req, res) => {
  const { title, content, imageUrl, priority, isPinned, isPublished } = req.body;
  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      imageUrl,
      priority: priority ?? 0,
      isPinned: !!isPinned,
      isPublished: isPublished ?? true,
      createdById: req.user.id,
    },
  });

  // Fan out an in-app notification to every member.
  const members = await prisma.user.findMany({ where: { role: 'MEMBER' }, select: { id: true } });
  if (members.length) {
    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.id,
        title: '🔔 New announcement published',
        body: title,
        type: 'ANNOUNCEMENT',
        linkPath: '/announcements',
      })),
    });
  }

  res.status(201).json({ announcement });
});

const update = asyncHandler(async (req, res) => {
  const { title, content, imageUrl, priority, isPinned, isPublished } = req.body;
  const announcement = await prisma.announcement.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(priority !== undefined && { priority }),
      ...(isPinned !== undefined && { isPinned }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });
  res.json({ announcement });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.announcement.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, create, update, remove };
