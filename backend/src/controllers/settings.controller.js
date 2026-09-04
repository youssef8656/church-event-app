const asyncHandler = require('express-async-handler');
const settingsService = require('../services/settings.service');
const eventService = require('../services/event.service');

// GET /api/settings
const getSettings = asyncHandler(async (req, res) => {
  const event = await eventService.getActiveEvent();
  const settings = await settingsService.getAllSettings(event.id);
  res.json({ eventId: event.id, settings });
});

// PUT /api/settings  { key, value }  (admin)
const updateSetting = asyncHandler(async (req, res) => {
  const event = await eventService.getActiveEvent();
  const { key, value } = req.body;
  const row = await settingsService.setSetting(event.id, key, value);
  res.json({ setting: row });
});

module.exports = { getSettings, updateSetting };
