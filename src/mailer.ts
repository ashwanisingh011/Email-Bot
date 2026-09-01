import nodemailer from "nodemailer"

export async function sendDailyEmail(
    senderEmail: string,
    appPassword: string,
    recipients: string[],
    subject: string,
    body: string
){
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: senderEmail,
            pass: appPassword,
        },
    });

    await transporter.sendMail({
        from: `"Ashwani Singh" <${senderEmail}>`,
        to: recipients,
        subject: subject,
        text: body,
    });

    console.log(`Email successfully dispatched to: ${recipients.join(", ")}`);
}