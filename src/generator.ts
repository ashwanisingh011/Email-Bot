import {GoogleGenerativeAI} from "@google/generative-ai";
import {ActivityReport} from "./github";

export async function generateReport(apiKey: string, activity: ActivityReport): Promise<{subject: string, body: string}> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});

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


const result = await model.generateContent({
    contents: [{role: "user", parts: [{text: prompt}]}],
    generationConfig: {responseMimeType: "application/json"},
})

const parsed = JSON.parse(result.response.text());
return parsed;
}

