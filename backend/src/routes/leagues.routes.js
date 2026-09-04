const router = require('express').Router();
const ctrl = require('../controllers/leagues.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');

router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.getOne);
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), ctrl.remove);

router.post('/:id/join', requireAuth, ctrl.join);
router.delete('/:id/leave', requireAuth, ctrl.leave);
// Admin OR a servant scoped to this specific league (scope-aware permission).
router.delete(
  '/:id/participants/:userId',
  requireAuth,
  requirePermission('league:manage', { scopeFrom: (req) => ({ scopeType: 'LEAGUE', scopeId: req.params.id }) }),
  ctrl.leave
);
router.post(
  '/:id/results',
  requireAuth,
  requirePermission('league:manage', { scopeFrom: (req) => ({ scopeType: 'LEAGUE', scopeId: req.params.id }) }),
  ctrl.recordResults
);

module.exports = router;
