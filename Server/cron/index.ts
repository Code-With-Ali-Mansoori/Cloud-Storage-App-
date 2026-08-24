import { removePendingSubscriptionsFromDatabase } from "./removePendingSubscriptions";

export const startCronJobs = () => {
  console.log(`
====================================================
🚀 Starting Scheduled Cron Jobs...
🕒 Timezone: Asia/Kolkata
📅 Jobs: 
   - 🧹 Remove pending subscriptions
====================================================
  `);
  removePendingSubscriptionsFromDatabase();
};
