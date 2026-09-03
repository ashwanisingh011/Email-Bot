import nodemailer from "nodemailer"

export async function sendDailyEmail(
    senderEmail: string,
    appPassword: string,
    recipients: string[],
    subject: string,
    body: string,
    developerName: string
){
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: senderEmail,
            pass: appPassword,
        },
    });

    await transporter.sendMail({
        from: `"${developerName}" <${senderEmail}>`,
        to: recipients,
        subject: subject,
        text: body,
    });

    console.log(`Email successfully dispatched to: ${recipients.join(", ")}`);
}