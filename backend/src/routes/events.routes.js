const router = require('express').Router();
const ctrl = require('../controllers/events.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/', requireAuth, requireRole('ADMIN'), ctrl.list);
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), ctrl.update);

module.exports = router;
