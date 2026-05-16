/**
 * Seats & Shifts Routes — /api/seats, /api/shifts
 */

const express = require('express');
const router  = express.Router();
const { Seat, Shift } = require('../models');
const { protect } = require('../middleware/auth');

// GET /api/seats  — all active seats (used by seat map)
router.get('/', protect, async (req, res, next) => {
  try {
    const seats = await Seat.find({ isActive: true }).sort({ row: 1, number: 1 }).lean();
    res.json(seats);
  } catch (err) { next(err); }
});

// GET /api/shifts — all shifts
router.get('/shifts', protect, async (req, res, next) => {
  try {
    const shifts = await Shift.find().lean();
    res.json(shifts);
  } catch (err) { next(err); }
});

module.exports = router;
