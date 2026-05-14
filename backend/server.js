/**
 * Study Library Management System — Server Entry Point
 * =====================================================
 * node server.js   |   npm run dev
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const connectDB             = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter }        = require('./middleware/rateLimiter');

const authRouter     = require('./routes/auth');
const bookingRouter  = require('./routes/bookings');
const adminRouter    = require('./routes/admin');
const seatsRouter    = require('./routes/seats');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin',    adminRouter);
app.use('/api/seats',    seatsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), ts: new Date() }));

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();

  if (process.env.NODE_ENV !== 'test') {
    const { startRenewalCron } = require('./utils/cron');
    startRenewalCron();
  }

  app.listen(PORT, () => {
    console.log(`✓  Server running → http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => { console.error('Startup failed:', err); process.exit(1); });

module.exports = app; // for tests
