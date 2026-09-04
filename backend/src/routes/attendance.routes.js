const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');

router.get('/my-qr.png', requireAuth, ctrl.myQrPng);
router.get('/my-history', requireAuth, ctrl.myHistory);

// Servants need the explicit "attendance:scan" permission; admins pass automatically.
router.post('/scan', requireAuth, requirePermission('attendance:scan'), ctrl.scan);

module.exports = router;
