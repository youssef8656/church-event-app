const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const storageService = require('../services/storage.service');
const ApiError = require('../utils/ApiError');

function inferCategory(mimeType) {
  if (mimeType.startsWith('image/')) return 'PHOTO';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('presentation')) return 'PRESENTATION';
  return 'OTHER';
}

// GET /api/media?category=PHOTO
const list = asyncHandler(async (req, res) => {
  const where = { isPublished: true, ...(req.query.category && { category: req.query.category }) };
  const media = await prisma.media.findMany({ where, orderBy: { publishedAt: 'desc' } });
  res.json({ media });
});

// POST /api/media (admin) — multipart/form-data: file + title/description
const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const { title, description } = req.body;

  const { fileUrl, fileKey } = await storageService.saveFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
  });

  const media = await prisma.media.create({
    data: {
      title: title || req.file.originalname,
      description,
      category: inferCategory(req.file.mimetype),
      fileUrl,
      fileKey,
      mimeType: req.file.mimetype,
      fileSizeBytes: req.file.size,
      createdById: req.user.id,
    },
  });

  // Notify members of new media.
  const members = await prisma.user.findMany({ where: { role: 'MEMBER' }, select: { id: true } });
  if (members.length) {
    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.id,
        title: '🔔 New media uploaded',
        body: media.title,
        type: 'MEDIA',
        linkPath: '/media',
      })),
    });
  }

  res.status(201).json({ media });
});

// DELETE /api/media/:id (admin)
const remove = asyncHandler(async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) throw ApiError.notFound('Media not found');
  await storageService.deleteFile(media.fileKey);
  await prisma.media.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, upload, remove };
