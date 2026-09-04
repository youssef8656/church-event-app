const router = require('express').Router();
const ctrl = require('../controllers/home.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, ctrl.homeFeed);

module.exports = router;
