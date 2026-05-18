/**
 * Auth Service
 * ────────────
 * Handles registration, login, and JWT token management.
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');
const { sendOtpEmail } = require('./notificationService');

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function registerInitiate({ name, email, phone, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('Email already in use.'), { status: 409 });

  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 });
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Hash password for storage
  const passwordHash = await bcrypt.hash(password, 12);

  // Create unverified user
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: 'student',
    isVerified: false,
    otp,
    otpExpiresAt,
  });

  // Send OTP to email
  await sendOtpEmail({ to: email, userName: name, otp }).catch(console.error);

  return {
    message: 'OTP sent to your email. Please verify to complete registration.',
    email,
    userId: user._id,
  };
}

async function verifyOTP({ userId, otp }) {
  const user = await User.findById(userId).select('+otp +otpExpiresAt');
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });

  if (user.isVerified) {
    throw Object.assign(new Error('User already verified.'), { status: 400 });
  }

  // Check if OTP is expired
  if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
    throw Object.assign(new Error('OTP has expired. Please register again.'), { status: 400 });
  }

  // Check maximum attempts
  if (user.otpAttempts >= 5) {
    throw Object.assign(new Error('Too many failed attempts. Please register again.'), { status: 429 });
  }

  // Verify OTP
  if (user.otp !== otp.toString()) {
    user.otpAttempts += 1;
    await user.save();
    throw Object.assign(new Error('Invalid OTP. Please try again.'), { status: 401 });
  }

  // Mark as verified
  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  await user.save();

  // Generate tokens
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

async function resendOTP({ userId }) {
  const user = await User.findById(userId).select('+otp +otpExpiresAt');
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });

  if (user.isVerified) {
    throw Object.assign(new Error('User already verified.'), { status: 400 });
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otp = otp;
  user.otpExpiresAt = otpExpiresAt;
  user.otpAttempts = 0;
  await user.save();

  // Send OTP to email
  await sendOtpEmail({ to: user.email, userName: user.name, otp }).catch(console.error);

  return { message: 'OTP resent to your email.' };
}

// Kept for backward compatibility or direct login
async function register({ name, email, phone, password, role = 'student' }) {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('Email already in use.'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, phone, passwordHash, role, isVerified: true });

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

module.exports = { registerInitiate, verifyOTP, resendOTP, register, login, refreshTokens, logout };
