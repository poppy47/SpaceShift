/**
 * Auth Routes — /api/auth
 */

const express = require('express');
const router  = express.Router();
const { registerInitiate, verifyOTP, resendOTP, register, login, refreshTokens, logout } = require('../services/authService');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register/initiate — Start registration with OTP
router.post('/register/initiate', authLimiter, async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required.' });
    }
    const result = await registerInitiate({ name, email, phone, password });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/register/verify — Verify OTP and complete registration
router.post('/register/verify', authLimiter, async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ error: 'userId and otp are required.' });
    }
    const result = await verifyOTP({ userId, otp });
    res.status(200).json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/register/resend-otp — Resend OTP to email
router.post('/register/resend-otp', authLimiter, async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }
    const result = await resendOTP({ userId });
    res.status(200).json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/register — Direct registration (backward compatibility)
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required.' });
    }
    const result = await register({ name, email, phone, password });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });
    const result = await login({ email, password });
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required.' });
    const tokens = await refreshTokens(refreshToken);
    res.json(tokens);
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    await logout(req.user._id);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;

// PATCH /api/auth/profile — update name and phone
router.patch('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    const user = await require('../models').User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim(), phone: phone?.trim() },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) { next(err); }
});

// PATCH /api/auth/change-password
router.patch('/change-password', protect, async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    const user = await require('../models').User.findById(req.user._id).select('+passwordHash');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});
