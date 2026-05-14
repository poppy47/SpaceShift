/**
 * Auth Middleware
 * ──────────────
 * Verifies JWT access tokens and attaches the decoded user to req.user.
 * requireAdmin additionally checks for the admin role.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Protect any route — must be logged in.
 */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return res.status(401).json({ error: msg });
  }
}

/**
 * Admin-only guard — must come after protect().
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { protect, requireAdmin };
