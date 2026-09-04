const router = require('express').Router();
const ctrl = require('../controllers/leaderboard.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/individual', requireAuth, ctrl.individual);
router.get('/my-rank', requireAuth, ctrl.myRank);
router.get('/teams', requireAuth, ctrl.teams);

module.exports = router;
