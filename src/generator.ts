import {GoogleGenerativeAI} from "@google/generative-ai";
import {ActivityReport} from "./github";

async function callWithRetry(fn: () => Promise<any>, retries: number = 3, delayMs = 2000): Promise<any> {
    try {
        return await fn();
    } catch (err: any) {
        const isNetworkError = err?.name === "TypeError" || err?.message?.includes("fetch failed");
        const isRateOrBusy = err?.status === 503 || err?.status === 429;
        if(retries > 0 && (isRateOrBusy || isNetworkError)){
            const errorDesc = isRateOrBusy
                ? `API rate limited or busy (${err?.status})`
                : `Network connectivity issue (${err?.message || "fetch failed"})`;
            console.warn(`${errorDesc}. Retrying in ${delayMs / 1000}s...`);
            await new Promise((res) => setTimeout(res, delayMs));
            return callWithRetry(fn, retries - 1, delayMs * 2);
        }
        throw err;
    }
}

export async function generateReport(apiKey: string, activity: ActivityReport): Promise<{subject: string, body: string}> {
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


    const prompt = `You are creating a formal Daily Status Report for Ashwani Singh, Full Stack Developer Intern at Tierce India Pvt Ltd.
Date: ${dateFormattedDisplay}

Raw Developer Activity Today:
Pull Requests: ${JSON.stringify(activity.prs, null, 2)}
Commits: ${JSON.stringify(activity.commits, null, 2)}

Requirements:
- Analyze the raw activity (PR titles, descriptions, and commit logs).
- Generate a technical, professional report matching the exact 6-part schema:
  1) TODAY'S TASKS ASSIGNED (Assigned By: Vaishali Patel, Deadline: ${dateFormattedSubject})
  2) WORK COMPLETED TODAY (WITH PROOF) (Include technical points, PR URLs as proof, Time Taken: 8 Hours)
  3) PENDING WORK (WITH REASON + NEXT ACTION)
  4) BLOCKERS / SUPPORT REQUIRED (IF ANY)
  5) DAILY OUTPUT SUMMARY
  6) NEXT WORK PLAN

- Close the body text with:
Regards,
Ashwani Singh
Full Stack Developer Intern
Tierce India Pvt Ltd

Output Format:
Return a strictly valid JSON object with keys "subject" and "body".
Subject format: "Daily Status Report - ${dateFormattedSubject} - Ashwani Singh (Brief Technical Highlight)"
`;

    // Cascade through models if Google API is experiencing 503 high demand or 429 rate limit
    const modelsToTry = Array.from(
        new Set([
            process.env.GEMINI_MODEL,
            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ].filter(Boolean) as string[])
    );

    let lastError: any;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Generating report using model: ${modelName}...`);
            const model = genAI.getGenerativeModel(
                { model: modelName },
                { timeout: 30000 } // 30s timeout prevents multi-minute hangs
            );

            const result = await callWithRetry(() =>
                model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" },
                }),
                2, // 2 retries per model
                2000
            );

            return JSON.parse(result.response.text());
        } catch (err: any) {
            lastError = err;
            const isRecoverable =
                err?.status === 503 ||
                err?.status === 429 ||
                err?.status === 404 ||
                err?.name === "TypeError" ||
                err?.message?.includes("fetch failed");

            if (isRecoverable && modelName !== modelsToTry[modelsToTry.length - 1]) {
                console.warn(
                    `Model ${modelName} unavailable (${err?.status || err?.message}). Falling back to next available model...`
                );
                continue;
            }
            throw err;
        }
    }

    throw lastError;
}

