/**
 * Payment Routes — /api/payments
 * ─────────────────────────────────
 * Razorpay integration for booking payments.
 *
 * Flow:
 *  1. POST /api/payments/create-order  → creates Razorpay order, returns order_id
 *  2. Frontend opens Razorpay checkout popup
 *  3. POST /api/payments/verify        → verifies signature, marks booking as paid
 */

const express  = require('express');
const router   = express.Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { Booking } = require('../models');
const { protect } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../services/notificationService');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/payments/create-order ──────────────────────────────────────────
// Creates a Razorpay order for a booking.
// Call this right before opening the Razorpay checkout popup.
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required.' });

    const booking = await Booking.findById(bookingId)
      .populate('user',  'name email phone')
      .populate('seat',  'label')
      .populate('shift', 'name');

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Booking is already paid.' });
    }

    // Razorpay amount is in paise (₹1 = 100 paise)
    const order = await razorpay.orders.create({
      amount:   booking.totalAmount, // already stored in paise
      currency: 'INR',
      receipt:  `booking_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        seatLabel: booking.seat.label,
        shiftName: booking.shift.name,
        studentName: booking.user.name,
      },
    });

    // Store razorpay order id on booking for verification later
    await Booking.findByIdAndUpdate(bookingId, { paymentReference: order.id });

    res.json({
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId:     process.env.RAZORPAY_KEY_ID,
      // Pre-fill checkout form
      prefill: {
        name:    booking.user.name,
        email:   booking.user.email,
        contact: booking.user.phone || '',
      },
      description: `Seat ${booking.seat.label} · ${booking.shift.name}`,
    });
  } catch (err) { next(err); }
});

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Verifies Razorpay signature after successful payment.
// Razorpay sends: razorpay_order_id, razorpay_payment_id, razorpay_signature
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark as failed
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'failed' });
      return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
    }

    // Mark booking as paid
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus:    'paid',
        paymentReference: razorpay_payment_id,
        paidAt:           new Date(),
        status:           'active',
      },
      { new: true }
    )
      .populate('user',  'name email')
      .populate('seat',  'label')
      .populate('shift', 'name');

    // Send confirmation email (fire and forget)
    sendBookingConfirmation({
      to:          booking.user.email,
      studentName: booking.user.name,
      seatLabel:   booking.seat.label,
      shiftName:   booking.shift.name,
      startDate:   booking.startDate,
      endDate:     booking.endDate,
      totalAmount: booking.totalAmount,
    }).catch(console.error);

    res.json({ success: true, booking });
  } catch (err) { next(err); }
});

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// Razorpay webhook — handles async payment events (optional but recommended).
// Add this URL in Razorpay Dashboard → Webhooks: https://yourserver.com/api/payments/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body      = req.body.toString();

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.id;
      const orderId   = event.payload.payment.entity.order_id;

      // Find booking by razorpay order id
      const booking = await Booking.findOneAndUpdate(
        { paymentReference: orderId },
        { paymentStatus: 'paid', paymentReference: paymentId, paidAt: new Date(), status: 'active' },
        { new: true }
      );

      if (booking) {
        console.log(`[Webhook] Payment captured for booking ${booking._id}`);
      }
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await Booking.findOneAndUpdate({ paymentReference: orderId }, { paymentStatus: 'failed' });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook error]', err.message);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

module.exports = router;
