import cron from "node-cron";

export function registerJobs() {
  // Deadline reminders (hourly)
  cron.schedule("0 * * * *", () => {
    console.log("[job] deadline reminders tick");
  });
  // Daily attendance summary (18:00)
  cron.schedule("0 18 * * *", () => {
    console.log("[job] daily attendance summary tick");
  });
  // Weekly report email (Mon 09:00)
  cron.schedule("0 9 * * 1", () => {
    console.log("[job] weekly report email tick");
  });
}
