/**
 * Auth Service
 * ────────────
 * Handles registration, login, and JWT token management.
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

async function register({ name, email, phone, password, role = 'student' }) {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('Email already in use.'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, phone, passwordHash, role });

  const accessToken  = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken });

  return { user: { _id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) throw Object.assign(new Error('Invalid credentials.'), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials.'), { status: 401 });

  const accessToken  = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken });

  return { user: { _id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken };
}

async function refreshTokens(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { status: 401 });
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw Object.assign(new Error('Refresh token reuse detected.'), { status: 401 });
  }

  const accessToken     = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

  return { accessToken, refreshToken: newRefreshToken };
}

async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

module.exports = { register, login, refreshTokens, logout };
