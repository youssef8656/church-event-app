const router = require('express').Router();
const ctrl = require('../controllers/teams.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), ctrl.remove);
router.post('/:id/assign', requireAuth, requireRole('ADMIN'), ctrl.assign);
router.post('/bulk-assign', requireAuth, requireRole('ADMIN'), ctrl.bulkAssign);
router.post('/:id/points/adjust', requireAuth, requireRole('ADMIN'), ctrl.adjustPoints);
router.get('/:id/points/history', requireAuth, requireRole('ADMIN'), ctrl.pointsHistory);

module.exports = router;
