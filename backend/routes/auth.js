/**
 * Auth Routes — /api/auth
 */

const express = require('express');
const router  = express.Router();
const { register, login, refreshTokens, logout } = require('../services/authService');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
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
