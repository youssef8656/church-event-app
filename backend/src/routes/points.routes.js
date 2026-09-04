const router = require('express').Router();
const ctrl = require('../controllers/points.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.post('/adjust', requireAuth, requireRole('ADMIN'), ctrl.adjust);
router.get('/history/:userId', requireAuth, ctrl.history);

module.exports = router;
