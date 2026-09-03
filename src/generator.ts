import {GoogleGenerativeAI} from "@google/generative-ai";
import {ActivityReport} from "./github";

export interface UserProfile {
    developerName: string;
    jobTitle: string;
    companyName: string;
    assignedBy: string;
    workHours: string;
}

function getErrorReason(err: any): { isRetriable: boolean; reason: string } {
    const name = err?.name || "";
    const msg = err?.message || "";
    const status = err?.status;

    const isTimeout =
        name === "AbortError" ||
        name === "GoogleGenerativeAIAbortError" ||
        msg.includes("aborted") ||
        msg.includes("timeout");
    const isNetwork =
        name === "TypeError" ||
        msg.includes("fetch failed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT");
    const isBusy = status === 503 || status === 429;

    if (isBusy) {
        return { isRetriable: true, reason: `API rate limited or server busy (${status})` };
    }
    if (isTimeout) {
        return { isRetriable: true, reason: `Request timed out (${msg || name})` };
    }
    if (isNetwork) {
        return { isRetriable: true, reason: `Network connectivity issue (${msg || name})` };
    }
    return { isRetriable: false, reason: msg || name || "Unknown error" };
}

async function callWithRetry(fn: () => Promise<any>, retries: number = 3, delayMs = 5000): Promise<any> {
    try {
        return await fn();
    } catch (err: any) {
        const { isRetriable, reason } = getErrorReason(err);
        if (retries > 0 && isRetriable) {
            console.warn(`${reason}. Retrying in ${delayMs / 1000}s...`);
            await new Promise((res) => setTimeout(res, delayMs));
            return callWithRetry(fn, retries - 1, delayMs * 2);
        }
        throw err;
    }
}

export async function generateReport(apiKey: string, activity: ActivityReport, profile: UserProfile): Promise<{subject: string, body: string}> {
    const genAI = new GoogleGenerativeAI(apiKey);

    const now = new Date();

    const dateFormattedDisplay = now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });

    const dateFormattedSubject = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata"
    }).replace(/\//g, "-");



    const prompt = `You are creating a formal Daily Status Report for ${profile.developerName}, ${profile.jobTitle} at ${profile.companyName}.
Date: ${dateFormattedDisplay}

Raw Developer Activity Today:
Pull Requests: ${JSON.stringify(activity.prs, null, 2)}
Commits: ${JSON.stringify(activity.commits, null, 2)}

Requirements:
- Analyze the raw activity (PR titles, descriptions, and commit logs).
- Generate a technical, professional report matching the exact 6-part schema:
  1) TODAY'S TASKS ASSIGNED (Assigned By: ${profile.assignedBy}, Deadline: ${dateFormattedSubject})
  2) WORK COMPLETED TODAY (WITH PROOF) (Include technical points, PR URLs as proof, Time Taken: ${profile.workHours} Hours)
  3) PENDING WORK (WITH REASON + NEXT ACTION)
  4) BLOCKERS / SUPPORT REQUIRED (IF ANY)
  5) DAILY OUTPUT SUMMARY
  6) NEXT WORK PLAN

- Close the body text with:
Regards,
${profile.developerName}
${profile.jobTitle}
${profile.companyName}


Output Format:
Return a strictly valid JSON object with keys "subject" and "body".
Subject format: "Daily Status Report - ${dateFormattedSubject} - ${profile.developerName} (Brief Technical Highlight)"
`;

    // Cascade through active Gemini 3 family models if Google API is experiencing 503 high demand or 429 rate limit
    const modelsToTry = Array.from(
        new Set([
            process.env.GEMINI_MODEL,
            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-3.5-flash"
        ].filter(Boolean) as string[])
    );

    let lastError: any;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Generating report using model: ${modelName}...`);
            const model = genAI.getGenerativeModel(
                { model: modelName },
                { timeout: 120000 } // 120s timeout allows deep generation under peak server load
            );

            const result = await callWithRetry(
                () =>
                    model.generateContent({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.2,
                            maxOutputTokens: 2500,
                        },
                    }),
                2, // 2 retries per model
                5000 // 5s initial backoff
            );

            return JSON.parse(result.response.text());
        } catch (err: any) {
            lastError = err;
            const name = err?.name || "";
            const msg = err?.message || "";
            const status = err?.status;

            const isRecoverable =
                status === 503 ||
                status === 429 ||
                status === 404 ||
                name === "AbortError" ||
                name === "GoogleGenerativeAIAbortError" ||
                name === "TypeError" ||
                msg.includes("aborted") ||
                msg.includes("timeout") ||
                msg.includes("fetch failed");

            if (isRecoverable && modelName !== modelsToTry[modelsToTry.length - 1]) {
                console.warn(
                    `Model ${modelName} encountered issue (${status || msg || name}). Falling back to next available model...`
                );
                continue;
            }
            throw err;
        }
    }

    throw lastError;
}

