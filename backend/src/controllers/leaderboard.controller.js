const asyncHandler = require('express-async-handler');
const pointsService = require('../services/points.service');
const eventService = require('../services/event.service');

// GET /api/leaderboard/individual?limit=5
const individual = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
  const leaderboard = await pointsService.getIndividualLeaderboard({ limit });
  res.json({ leaderboard });
});

// GET /api/leaderboard/my-rank
const myRank = asyncHandler(async (req, res) => {
  const rank = await pointsService.getUserRank(req.user.id);
  res.json({ rank });
});

// GET /api/leaderboard/teams?scope=TODAY|CUMULATIVE&eventDayId=...
const teams = asyncHandler(async (req, res) => {
  const eventDayId = req.query.eventDayId || (await eventService.getCurrentEventDay()).id;
  const scope = req.query.scope === 'TODAY' ? 'TODAY' : 'CUMULATIVE';
  const leaderboard = await pointsService.getTeamLeaderboard({ eventDayId, scope });
  res.json({ leaderboard, scope, eventDayId });
});

module.exports = { individual, myRank, teams };
