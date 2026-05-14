/**
 * Renewal Reminder Cron Job
 * ─────────────────────────
 * Runs every day at 09:00 and emails students whose memberships
 * expire within 3 days.
 *
 * Start standalone: node utils/cron.js
 * Or integrate into app.js by requiring this file.
 */

const cron = require('node-cron');
const { getExpiringSoon } = require('../services/availabilityService');
const { sendRenewalReminder } = require('../services/notificationService');

function startRenewalCron() {
  // Every day at 09:00
  cron.schedule('0 9 * * *', async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Running renewal reminder job`);

    try {
      const expiring = await getExpiringSoon(3);
      if (!expiring.length) {
        console.log('[CRON] No expiring memberships today.');
        return;
      }

      const results = await Promise.allSettled(
        expiring.map(async (b) => {
          const daysLeft = Math.ceil((new Date(b.endDate) - new Date()) / (1000 * 60 * 60 * 24));
          await sendRenewalReminder({
            to:          b.user.email,
            studentName: b.user.name,
            seatLabel:   b.seat.label,
            shiftName:   b.shift.name,
            endDate:     b.endDate,
            daysLeft,
          });
        })
      );

      const sent   = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      console.log(`[CRON] Reminders sent: ${sent}, failed: ${failed}`);
    } catch (err) {
      console.error('[CRON] Renewal job error:', err.message);
    }
  });

  console.log('✓  Renewal reminder cron scheduled (daily 09:00)');
}

module.exports = { startRenewalCron };
