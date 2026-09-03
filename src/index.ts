import dns from 'node:dns';
// Force IPv4 first to prevent IPv6 socket hangs in GitHub Actions / Docker runners
dns.setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
dotenv.config();

import { fetchDailyActivity } from './github';
import { generateReport } from './generator';
import { sendDailyEmail } from './mailer';

function validateEnv() {
  const required = [
    'GH_PAT',
    'GEMINI_API_KEY',
    'SENDER_EMAIL',
    'GMAIL_APP_PASSWORD',
    'GITHUB_USERNAME',
    'TARGET_REPOS',
    'RECIPIENTS',
    'DEVELOPER_NAME',
    'JOB_TITLE',
    'COMPANY_NAME',
    'ASSIGNED_BY',
    'WORK_HOURS'
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. Please check your .env file or GitHub Secrets.`
    );
  }
}

async function main() {
  validateEnv();

  const pat = process.env.GH_PAT!;
  const geminiKey = process.env.GEMINI_API_KEY!;
  const sender = process.env.SENDER_EMAIL!;
  const appPass = process.env.GMAIL_APP_PASSWORD!;
  const username = process.env.GH_USERNAME!;
  const repos = (process.env.TARGET_REPOS || "").split(",").map((r) => r.trim());
  const recipients = (process.env.RECIPIENTS || "").split(",").map((r) => r.trim());

  const profile = {
    developerName: process.env.DEVELOPER_NAME!,
    jobTitle: process.env.JOB_TITLE!,
    companyName: process.env.COMPANY_NAME!,
    assignedBy: process.env.ASSIGNED_BY!,
    workHours: process.env.WORK_HOURS!,
  }

  console.log("1. Fetching GitHub activity for today...");
  const activity = await fetchDailyActivity(pat, username, repos);
  console.log(`Found ${activity.prs.length} PR(s) and ${activity.commits.length} commit(s).`);

  console.log("2. Generating AI daily status report...");
  const report = await generateReport(geminiKey, activity, profile);
  console.log("Generated Subject:", report.subject);

  console.log("3. Dispatching email report...");
  await sendDailyEmail(sender, appPass, recipients, report.subject, report.body, profile.developerName);

  console.log(" Daily status report dispatched successfully!");
}

main().catch((err) => {
  console.error("Pipeline execution failed:", err);
  process.exit(1);
});