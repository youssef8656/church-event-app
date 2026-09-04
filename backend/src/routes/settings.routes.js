const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/', requireAuth, requireRole('ADMIN'), ctrl.getSettings);
router.put('/', requireAuth, requireRole('ADMIN'), ctrl.updateSetting);

module.exports = router;
