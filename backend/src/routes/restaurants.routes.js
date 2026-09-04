const router = require('express').Router();
const ctrl = require('../controllers/restaurants.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), ctrl.remove);
router.post('/:id/menu', requireAuth, requireRole('ADMIN'), upload.single('file'), ctrl.uploadMenu);

module.exports = router;
