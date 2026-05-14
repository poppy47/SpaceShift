/**
 * Notification Service
 * ────────────────────
 * Sends transactional emails via Nodemailer (SMTP).
 * Configure SMTP_* env vars to use Gmail, SendGrid, etc.
 */

const nodemailer = require('nodemailer');

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = `"Study Library" <${process.env.SMTP_USER}>`;

async function sendBookingConfirmation({ to, studentName, seatLabel, shiftName, startDate, endDate, totalAmount }) {
  const transporter = createTransport();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Booking Confirmed — Seat ${seatLabel} (${shiftName})`,
    html: `
      <p>Hi ${studentName},</p>
      <p>Your seat has been booked successfully.</p>
      <table>
        <tr><td><strong>Seat</strong></td><td>${seatLabel}</td></tr>
        <tr><td><strong>Shift</strong></td><td>${shiftName}</td></tr>
        <tr><td><strong>From</strong></td><td>${new Date(startDate).toDateString()}</td></tr>
        <tr><td><strong>To</strong></td><td>${new Date(endDate).toDateString()}</td></tr>
        <tr><td><strong>Amount</strong></td><td>₹${(totalAmount / 100).toLocaleString('en-IN')}</td></tr>
      </table>
      <p>See you at the library!</p>
    `,
  });
}

async function sendRenewalReminder({ to, studentName, seatLabel, shiftName, endDate, daysLeft }) {
  const transporter = createTransport();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Membership Expiring in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} — Renew Now`,
    html: `
      <p>Hi ${studentName},</p>
      <p>Your membership for <strong>Seat ${seatLabel} (${shiftName})</strong> expires on
         <strong>${new Date(endDate).toDateString()}</strong> — that's ${daysLeft} day${daysLeft !== 1 ? 's' : ''} away.</p>
      <p>Please visit the library or log in to renew your seat before someone else books it.</p>
    `,
  });
}

async function sendCancellationConfirmation({ to, studentName, seatLabel, shiftName }) {
  const transporter = createTransport();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Booking Cancelled — Seat ${seatLabel}`,
    html: `
      <p>Hi ${studentName},</p>
      <p>Your booking for <strong>Seat ${seatLabel} (${shiftName})</strong> has been cancelled.</p>
      <p>If this was a mistake, please contact the library admin.</p>
    `,
  });
}

module.exports = { sendBookingConfirmation, sendRenewalReminder, sendCancellationConfirmation };
