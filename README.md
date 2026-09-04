# 🤖 Automated Daily Status Report Bot

> Autonomous AI-powered assistant that tracks your daily GitHub pull requests and commits, summarizes them into a formal 6-part technical status report using Google Gemini, and dispatches the email to your managers and team on schedule.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.6%20Flash-4285F4?style=flat&logo=google&logoColor=white)](https://aistudio.google.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-2088FF?style=flat&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## 📌 Problem This Project Solves

At the end of every work day, software engineers, interns, and contractors spend **15–30 minutes** manually:
1. Searching through git logs, branch commits, and pull requests to remember what they accomplished.
2. Manually writing and formatting status emails to match company reporting guidelines.
3. Remembering PR links, commit hashes, blockers, and next steps.
4. Sending emails on time, or accidentally sending empty reports on holidays and sick days.

### ✨ The Solution
This bot automates the entire lifecycle:
* **Zero Manual Effort**: Automatically inspects your assigned repositories, forks, and pull requests.
* **Deep Commit Extraction**: Discovers commits inside active/open PR branches, not just the merged base branch.
* **Intelligent Synthesis**: Gemini AI digests technical diffs and outputs a formal, executive-ready 6-section report.
* **Smart Holiday Detection**: If you made 0 commits and 0 PRs (holidays, weekends, sick leave), the bot gracefully skips execution without sending empty emails.
* **Self-Healing Architecture**: Built-in multi-model fallback cascade (`gemini-3.6-flash` → `gemini-3.7-flash` → `gemini-3.5-flash`), 120s timeout, and IPv4 DNS routing ensure 99.9% delivery reliability even during Google API traffic spikes.
* **100% Configurable**: No hardcoded names or company details. Everything is driven by environment variables.

---

## 🏗️ Architecture & Tech Stack

```mermaid
flowchart LR
    A[Cloud Cron / 6:30 PM] -->|Trigger| B[GitHub Actions Runner]
    B -->|Fetch Activity| C[GitHub REST API / Octokit]
    C -->|PRs & Branch Commits| B
    B -->|Check Activity| D{Any Work Today?}
    D -- No Activity --> E[☕ Log Holiday & Exit Cleanly]
    D -- Has Activity --> F[Google Gemini AI / Model Cascade]
    F -->|Structured 6-Part JSON| G[Nodemailer / Gmail SMTP]
    G -->|Dispatches Email + CC| H[Manager & Team Inboxes]
```

### Core Technologies & Their Roles

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Language & Engine** | [TypeScript](https://www.typescriptlang.org/) & [Node.js 22 LTS](https://nodejs.org/) | Strict type safety, clean asynchronous pipeline, and native `undici` fetch engine. |
| **GitHub Integration** | [@octokit/rest](https://github.com/octokit/rest.js/) | Queries PRs, reviews, and granular branch commit messages across private/public repos and forks. |
| **AI Intelligence** | [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) | Evaluates developer work logs and generates formal reports using JSON structured outputs. |
| **Email Delivery** | [Nodemailer](https://nodemailer.com/) | Dispatches formatted plain-text status updates with custom display names, primary recipients, and CC lists. |
| **Automation** | [GitHub Actions](https://github.com/features/actions) & [cron-job.org](https://cron-job.org/) | Serverless CI/CD execution triggered daily at business closing time. |

---

## 📋 The 6-Part Daily Status Report Schema

The AI generates a formal report structured into the exact 6-part schema required by enterprise development teams:

```text
Subject: Daily Status Report - DD-MM-YYYY - [Developer Name] ([Brief Technical Highlight])

1) TODAY'S TASKS ASSIGNED
- Assigned By: [Manager / Lead Name]
- Deadline: DD-MM-YYYY
- Task: [Extracted task objectives]

2) WORK COMPLETED TODAY (WITH PROOF)
- [Granular technical accomplishments extracted from PR commits]
- Time Taken: [Work Hours, e.g. 8 Hours]
- Proof: [Link to Pull Request]

3) PENDING WORK (WITH REASON + NEXT ACTION)
- [Review statuses, pending merges, or incomplete phases with next steps]

4) BLOCKERS / SUPPORT REQUIRED (IF ANY)
- [Technical blockers or None]

5) DAILY OUTPUT SUMMARY
- [High-level executive summary of the value delivered today]

6) NEXT WORK PLAN
- [Action items planned for tomorrow]

Regards,
[Developer Name]
[Job Title]
[Company Name]
```

---

## 🔑 Step-by-Step API Key & Credential Guide

To run this bot, you need three credentials. Click the guidance dropdowns below for complete step-by-step instructions:

<details>
<summary><b>1. GitHub Personal Access Token (GH_PAT)</b></summary>

### Why it's needed:
Allows the bot to query your pull requests, branch commits, and repository activity across public or private company repositories.

### Step-by-Step:
1. Go directly to [GitHub Personal Access Tokens (Classic)](https://github.com/settings/tokens).
2. Click **Generate new token** $\rightarrow$ **Generate new token (classic)**.
3. Set the **Note** to `daily-report-bot`.
4. Choose an expiration (e.g. `90 days` or `No expiration` for service accounts).
5. Select the following scopes:
   * ✅ **`repo`** (Full control of private repositories — required to inspect private company PRs and commits).
   * ✅ **`read:org`** (Read org and team membership — required if your target repo is under an organization).
6. Click **Generate token** at the bottom.
7. ⚠️ **Copy your token immediately** (`ghp_...`).
8. *(Optional - For Organization SSO)*: If your company enforces SAML Single Sign-On, click **Configure SSO** next to your newly generated token and click **Authorize** for your organization.
</details>

<details>
<summary><b>2. Google Gemini API Key (GEMINI_API_KEY)</b></summary>

### Why it's needed:
Powers the AI engine that analyzes raw commits and generates the formal structured report.

### Step-by-Step:
1. Go to [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key**.
4. Choose an existing Google Cloud project or select **Create API key in new project**.
5. ⚠️ **Copy the generated API key** (`AIzaSy...`).
6. *(Note)*: Free tier includes generous rate limits suitable for multiple daily report executions.
</details>

<details>
<summary><b>3. Gmail App Password (GMAIL_APP_PASSWORD)</b></summary>

### Why it's needed:
Allows Nodemailer to send emails through Gmail's SMTP servers securely without exposing your main Google account password.

### Step-by-Step:
1. Ensure **2-Step Verification** is enabled on your Google Account:
   * Visit [Google Security Settings](https://myaccount.google.com/security) $\rightarrow$ Turn on **2-Step Verification**.
2. Go directly to [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Enter an app name, e.g. `Daily Report Bot`.
4. Click **Create**.
5. Google will display a **16-character passcode** (e.g. `abcd efgh ijkl mnop`).
6. ⚠️ **Copy this 16-character code** (spaces can be omitted: `abcdefghijklmnop`).
</details>

---

## ⚙️ Environment Variables Reference

Create a `.env` file for local testing or configure these as **GitHub Secrets** under your repo's **Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions**:

| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `GH_PAT` | **Yes** | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `GH_USERNAME` | **Yes** | Your GitHub username | `octocat` |
| `TARGET_REPOS` | **Yes** | Comma-separated target repos (supports company repo + fork) | `CompanyOrg/ProjectRepo,yourusername/ProjectRepo` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key | `AIzaSyxxxxxxxxxx` |
| `GEMINI_MODEL` | No | Model override (defaults to `gemini-3.6-flash`) | `gemini-3.6-flash` |
| `SENDER_EMAIL` | **Yes** | Gmail address used to dispatch emails | `developer@gmail.com` |
| `GMAIL_APP_PASSWORD` | **Yes** | 16-character Google App Password | `abcdefghijklmnop` |
| `RECIPIENTS` | **Yes** | Primary email addresses separated by commas | `lead@company.com,manager@company.com` |
| `CC_RECIPIENTS` | No | CC email addresses separated by commas | `colleague@company.com` |
| `DEVELOPER_NAME` | **Yes** | Your full name for reports & email headers | `Alex Mercer` |
| `JOB_TITLE` | **Yes** | Your official job title | `Full Stack Developer Intern` |
| `COMPANY_NAME` | **Yes** | Organization name | `Acme Corp Pvt Ltd` |
| `ASSIGNED_BY` | **Yes** | Your manager, supervisor, or mentor's name | `Jane Doe` |
| `WORK_HOURS` | **Yes** | Reported daily work hours | `8 Hours` |

---

## 🚀 Local Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/ashwanisingh011/Email-Bot.git
cd Email-Bot
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Open .env and fill in your values
```

### 3. Build & Run
```bash
# Compile TypeScript
npm run build

# Run in production mode
npm run prod
```

---

## ⏰ Automated Cloud Scheduling Setup

To guarantee your report dispatches at **6:30 PM IST sharp** every weekday without delays or reliance on a local laptop:

### 1. Add GitHub Repository Secrets
In your GitHub repository:
1. Navigate to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Click **New repository secret** for each variable listed in the [Environment Variables Reference](#️-environment-variables-reference).

### 2. Configure [cron-job.org](https://cron-job.org)
GitHub Actions' internal cron queue often delays free jobs during peak hours. Using a free webhook cron triggers `workflow_dispatch` within **2 seconds**:

1. Create a free account at [cron-job.org](https://cron-job.org).
2. Click **Create Cronjob**:
   * **Title**: `Daily Report Bot`
   * **URL**: `https://api.github.com/repos/YOUR_GITHUB_USERNAME/YOUR_REPO/actions/workflows/daily-report.yml/dispatches`
   * **Schedule**: Select **Every day at 18:30** (6:30 PM).
   * **Timezone**: `Asia/Kolkata (IST)`
   * **Days**: Check **Monday through Friday**.
3. Under **Advanced Settings**:
   * **Request Method**: `POST`
   * **Request Body**: `{"ref": "main"}`
   * **Headers**:
     * `Authorization`: `Bearer YOUR_GH_PAT`
     * `Accept`: `application/vnd.github.v3+json`
     * `User-Agent`: `Email-Bot`
4. Click **Create**.

---

## 🛡️ Reliability & Fault-Tolerance Features

* **IPv4 DNS Priority Enforcement**: GitHub Actions `ubuntu-latest` runners drop outbound IPv6 packets to Google APIs. The bot automatically invokes `dns.setDefaultResultOrder('ipv4first')` to ensure zero connection hangs.
* **120-Second Generation Window**: Provides ample time for deep structured JSON generation during peak datacenter hours.
* **Self-Healing AI Model Cascade**:
  ```text
  gemini-3.6-flash (Primary)
         ↓ [On 503 Capacity / Timeout]
  gemini-3.7-flash (Secondary)
         ↓ [On 503 Capacity / Timeout]
  gemini-3.5-flash (Tertiary)
  ```
* **Smart Holiday Skip**: Checks activity before calling external APIs. If 0 commits and 0 PRs are detected, it terminates cleanly with exit code 0 to avoid sending blank reports.

---

## 🤝 Contributing & Customization

Contributions, suggestions, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: add AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **ISC License**. See `LICENSE` for more information.
