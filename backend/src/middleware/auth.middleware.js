const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

/**
 * Requires a valid access token. Attaches req.user = { id, role }.
 * The role/permissions are re-fetched from the DB (not just trusted from the
 * token) whenever a request needs authorization decisions, so a revoked
 * role/permission takes effect immediately rather than waiting for token expiry.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw ApiError.unauthorized('Missing access token');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = { id: user.id, role: user.role, email: user.email, fullName: user.fullName };
  next();
});

/**
 * Restricts to one or more global roles, e.g. requireRole('ADMIN')
 * or requireRole('ADMIN', 'SERVANT').
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have access to this resource');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
