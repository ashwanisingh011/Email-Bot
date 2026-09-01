import dotenv from 'dotenv'
dotenv.config();

import { fetchDailyActivity } from './github';
import { generateReport } from './generator';
import { sendDailyEmail } from './mailer';

async function main() {
  const pat = process.env.GH_PAT!;
  const geminiKey = process.env.GEMINI_API_KEY!;
  const sender = process.env.SENDER_EMAIL!;
  const appPass = process.env.GMAIL_APP_PASSWORD!;
  const username = process.env.GITHUB_USERNAME!;
  const repos = (process.env.TARGET_REPOS || "").split(",").map((r) => r.trim());
  const recipients = (process.env.RECIPIENTS || "").split(",").map((r) => r.trim());

  console.log("1. Fetching GitHub activity for today...");
  const activity = await fetchDailyActivity(pat, username, repos);
  console.log(`Found ${activity.prs.length} PR(s) and ${activity.commits.length} commit(s).`);

  console.log("2. Generating AI daily status report...");
  const report = await generateReport(geminiKey, activity);
  console.log("Generated Subject:", report.subject);

  console.log("3. Dispatching email report...");
  await sendDailyEmail(sender, appPass, recipients, report.subject, report.body);

  console.log(" Daily status report dispatched successfully!");
}

main().catch((err) => {
  console.error("Pipeline execution failed:", err);
  process.exit(1);
});