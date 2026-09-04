const router = require('express').Router();
const ctrl = require('../controllers/program.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), ctrl.remove);

module.exports = router;
