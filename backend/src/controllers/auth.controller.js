const asyncHandler = require('express-async-handler');
const authService = require('../services/auth.service');
const env = require('../config/env');

const REFRESH_COOKIE = 'refreshToken';
const cookieOpts = {
  httpOnly: true,
secure: env.nodeEnv === 'production',
sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: '/api/auth',
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ user, message: 'Registered. Check your email to verify your account.' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.json({ message: 'Email verified successfully.' });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
  res.json({ user, accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const { user, accessToken, refreshToken } = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
  res.json({ user, accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ message: 'Logged out.' });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, verifyEmail, login, refresh, logout, me };
