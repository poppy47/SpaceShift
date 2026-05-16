/**
 * Study Library Management System — Mongoose Schemas
 * =====================================================
 * Models: User, Seat, Shift, Booking
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─────────────────────────────────────────────
// 1. USER
// ─────────────────────────────────────────────
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────
// 2. SHIFT
// ─────────────────────────────────────────────
const shiftSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['Morning', 'Day', 'Evening', 'Full Day'],
    },
    startTime: { type: String, required: true },
    endTime:   { type: String, required: true },
    priceMultiplier: { type: Number, default: 1.0, min: 0 },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────
// 3. SEAT
// ─────────────────────────────────────────────
const seatSchema = new Schema(
  {
    label:   { type: String, required: true, unique: true, uppercase: true, trim: true },
    row:     { type: String, required: true, uppercase: true },
    number:  { type: Number, required: true },
    section: { type: String, default: 'Main' },
    baseMonthlyPrice: { type: Number, required: true, min: 0 },
    amenities: {
      hasCharging:  { type: Boolean, default: true },
      hasLamp:      { type: Boolean, default: true },
      hasLocker:    { type: Boolean, default: false },
      isWindowSide: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

seatSchema.index({ section: 1, row: 1, number: 1 }, { unique: true });

// ─────────────────────────────────────────────
// 4. BOOKING
// ─────────────────────────────────────────────
const bookingSchema = new Schema(
  {
    user:  { type: Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    seat:  { type: Schema.Types.ObjectId, ref: 'Seat',  required: true, index: true },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true, index: true },

    startDate:    { type: Date, required: true },
    endDate:      { type: Date, required: true },
    durationType: { type: String, enum: ['1_month', '3_months', 'custom'], required: true },

    totalAmount:      { type: Number, required: true, min: 0 },
    paymentStatus:    { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    paymentReference: { type: String, default: null },
    paidAt:           { type: Date,   default: null },

    status:      { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    cancelledAt: { type: Date,   default: null },
    notes:       { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ seat: 1, shift: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ status: 1, endDate: 1 });
bookingSchema.index({ paymentStatus: 1, paidAt: 1 });

bookingSchema.pre('validate', function (next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    return next(new Error('endDate must be on or after startDate'));
  }
  next();
});

const User    = mongoose.model('User',    userSchema);
const Shift   = mongoose.model('Shift',   shiftSchema);
const Seat    = mongoose.model('Seat',    seatSchema);
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { User, Seat, Shift, Booking };
