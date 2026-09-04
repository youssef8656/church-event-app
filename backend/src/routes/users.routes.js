const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/me/profile', requireAuth, ctrl.myProfile);

module.exports = router;
