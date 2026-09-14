const prisma = require('../config/prisma');

const DEFAULTS = {
  'attendance.graceMinutes': '5',
  'attendance.points': '10',
  // <<< NEW DEFAULTS FOR SECONDARY GRACE & POINTS >>>
  'attendance.secondGraceMinutes': '2',   // smaller window (minutes)
  'attendance.secondPoints': '5',         // fewer points awarded
};

async function getSetting(eventId, key) {
  const row = await prisma.eventSetting.findUnique({
    where: { eventId_key: { eventId, key } },
  });
  return row ? row.value : DEFAULTS[key] ?? null;
}

async function setSetting(eventId, key, value) {
  return prisma.eventSetting.upsert({
    where: { eventId_key: { eventId, key } },
    update: { value: String(value) },
    create: { eventId, key, value: String(value) },
  });
}

async function getAllSettings(eventId) {
  const rows = await prisma.eventSetting.findMany({ where: { eventId } });
  const merged = { ...DEFAULTS };
  for (const row of rows) merged[row.key] = row.value;
  return merged;
}

module.exports = { getSetting, setSetting, getAllSettings, DEFAULTS };
