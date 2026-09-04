const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

/**
 * Flexible permission gate for the SERVANT role (and anyone else).
 *
 * Usage: requirePermission('attendance:scan')
 *        requirePermission('league:manage', { scopeFrom: (req) => ({ scopeType: 'LEAGUE', scopeId: req.params.leagueId }) })
 *
 * Rules:
 *  - ADMIN always passes (full access).
 *  - Otherwise the user must hold a UserPermission row matching `key`.
 *    - If a scope resolver is given, the permission must either be global
 *      (scopeType/scopeId null) or match the resolved scope exactly.
 *  - MEMBER role never has permissions by default; servants must be
 *    explicitly granted permissions by an admin.
 */
function requirePermission(key, options = {}) {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (req.user.role === 'ADMIN') return next();

    const scope = options.scopeFrom ? options.scopeFrom(req) : null;

    const grant = await prisma.userPermission.findFirst({
      where: {
        userId: req.user.id,
        permission: { key },
        OR: [
          { scopeType: null, scopeId: null },
          scope
            ? { scopeType: scope.scopeType, scopeId: scope.scopeId }
            : undefined,
        ].filter(Boolean),
      },
    });

    if (!grant) {
      throw ApiError.forbidden(`Missing required permission: ${key}`);
    }
    next();
  });
}

module.exports = { requirePermission };
