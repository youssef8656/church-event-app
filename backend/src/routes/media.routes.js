const router = require('express').Router();
const ctrl = require('../controllers/media.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireRole('ADMIN'), upload.single('file'), ctrl.upload);
router.delete('/:id', requireAuth, requireRole('ADMIN'), ctrl.remove);

module.exports = router;
