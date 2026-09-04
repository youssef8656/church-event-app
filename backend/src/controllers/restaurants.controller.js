const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const storageService = require('../services/storage.service');
const ApiError = require('../utils/ApiError');

// GET /api/restaurants
const list = asyncHandler(async (req, res) => {
  const restaurants = await prisma.restaurant.findMany({
    include: { menus: true },
    orderBy: { name: 'asc' },
  });
  res.json({ restaurants });
});

// POST /api/restaurants (admin)
const create = asyncHandler(async (req, res) => {
  const { name, description, address, phone, mapLink, openingHours } = req.body;
  const restaurant = await prisma.restaurant.create({
    data: { name, description, address, phone, mapLink, openingHours },
  });
  res.status(201).json({ restaurant });
});

// PUT /api/restaurants/:id (admin)
const update = asyncHandler(async (req, res) => {
  const { name, description, address, phone, mapLink, openingHours } = req.body;
  const restaurant = await prisma.restaurant.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(mapLink !== undefined && { mapLink }),
      ...(openingHours !== undefined && { openingHours }),
    },
  });
  res.json({ restaurant });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.restaurant.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// POST /api/restaurants/:id/menu (admin) — multipart upload, PDF or image
const uploadMenu = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const { fileUrl, fileKey } = await storageService.saveFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
  });
  const menu = await prisma.restaurantMenu.create({
    data: { restaurantId: req.params.id, fileUrl, fileKey, mimeType: req.file.mimetype },
  });
  res.status(201).json({ menu });
});

module.exports = { list, create, update, remove, uploadMenu };
