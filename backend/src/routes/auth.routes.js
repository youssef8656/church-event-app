const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validators');
const { requireAuth } = require('../middleware/auth.middleware');

// Stricter limiter on auth endpoints to slow down credential stuffing / brute force.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post('/register', authLimiter, validate({ body: registerSchema }), ctrl.register);
router.get('/verify-email', ctrl.verifyEmail);
router.post('/login', authLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/refresh', authLimiter, ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
