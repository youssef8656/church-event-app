const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('./email.service');

const SALT_ROUNDS = 12;

async function register({ fullName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: 'MEMBER',
      emailVerifyToken,
      emailVerifyExpiresAt,
    },
  });

  await sendVerificationEmail(user, emailVerifyToken);

  return sanitizeUser(user);
}

async function verifyEmail(token) {
  const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });
  if (!user || !user.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
    throw ApiError.badRequest('Verification link is invalid or expired');
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiresAt: null },
  });
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30d
    },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized('User no longer exists');

  // Rotate: revoke old, issue new
  const newRefreshToken = signRefreshToken(user);
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    }),
  ]);

  const accessToken = signAccessToken(user);
  return { accessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
}

function sanitizeUser(user) {
  const { passwordHash, emailVerifyToken, ...safe } = user;
  return safe;
}

module.exports = { register, verifyEmail, login, refresh, logout, sanitizeUser };
