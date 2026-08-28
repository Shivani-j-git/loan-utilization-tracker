const cron  = require('node-cron');
const admin = require('firebase-admin');
const Loan  = require('../models/Loan');
const User  = require('../models/User');

// Initialize Firebase
try {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
  );
  if (serviceAccount.type) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase initialized');
  }
} catch (err) {
  console.log('⚠️ Firebase not configured:', err.message);
}

// ─── SEND PUSH NOTIFICATION ───────────────────────
const sendNotification = async (fcmToken, title, body) => {
  try {
    await admin.messaging().send({
      token:        fcmToken,
      notification: { title, body },
      android: {
        notification: {
          sound:    'default',
          priority: 'high',
        }
      },
      apns: {
        payload: {
          aps: { sound: 'default' }
        }
      }
    });
    console.log(`✅ Notification sent: ${title}`);
  } catch (err) {
    console.error('❌ Notification failed:', err.message);
  }
};

// ─── START CRON JOB ───────────────────────────────
exports.startCronJob = () => {

  // Run every day at 8:00 AM IST
  cron.schedule('0 8 * * *', async () => {
    console.log('🔔 Running EMI notification job...');

    try {
      const today         = new Date();
      const threeDaysLater = new Date(
        today.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      // Find loans with EMI due in next 3 days
      const upcomingLoans = await Loan.find({
        status:      'active',
        nextEmiDate: {
          $gte: today,
          $lte: threeDaysLater,
        },
      }).populate('userId', 'name fcmToken');

      for (const loan of upcomingLoans) {
        const user = loan.userId;
        if (!user || !user.fcmToken) continue;

        // Calculate days remaining
        const daysLeft = Math.ceil(
          (loan.nextEmiDate - today)
          / (1000 * 60 * 60 * 24)
        );

        // Send EMI reminder
        await sendNotification(
          user.fcmToken,
          '💰 EMI Reminder',
          `Your ${loan.loanType} loan EMI of ` +
          `Rs.${loan.emiAmount.toLocaleString()} ` +
          `is due in ${daysLeft} day(s). ` +
          `Don't miss it!`
        );

        // Send health score alert if low
        if (loan.utilizationScore < 60) {
          await sendNotification(
            user.fcmToken,
            '⚠️ Loan Health Alert',
            `Your ${loan.loanType} loan health ` +
            `score is ${loan.utilizationScore}/100. ` +
            `Open app for AI advice.`
          );
        }
      }

      console.log(
        `✅ Notifications sent to ${upcomingLoans.length} borrowers`
      );

    } catch (err) {
      console.error('❌ Cron job error:', err.message);
    }

  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Notification cron job started');
};
