/**
 * Session reminder scheduler
 */
const { sendSessionReminders } = require("../controllers/sessionController");

/**
 * Start scheduler to run at specified interval
 * @param {number} intervalHours - Interval in hours
 */
const startReminderScheduler = (intervalHours = 1) => {
  console.log(
    `Starting session reminder scheduler (runs every ${intervalHours} hour(s))`
  );

  // Convert hours to milliseconds
  const interval = intervalHours * 60 * 60 * 1000;

  // Run immediately on startup
  sendSessionReminders()
    .then((result) => {
      console.log(`Initial reminder check: ${result.message}`);
    })
    .catch((error) => {
      console.error("Error in initial reminder check:", error);
    });

  // Set up interval
  setInterval(async () => {
    try {
      const result = await sendSessionReminders();
      console.log(`Scheduled reminder check: ${result.message}`);
    } catch (error) {
      console.error("Error in scheduled reminder check:", error);
    }
  }, interval);
};

module.exports = {
  startReminderScheduler,
};
