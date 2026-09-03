import nodemailer from "nodemailer"

export async function sendDailyEmail(
    senderEmail: string,
    appPassword: string,
    recipients: string[],
    subject: string,
    body: string,
    developerName: string,
    ccRecipients?: string[]
){
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: senderEmail,
            pass: appPassword,
        },
    });

    const mailOptions: nodemailer.SendMailOptions = {
        from: `"${developerName}"<${senderEmail}>`,
        to: recipients,
        subject: subject,
        text: body,
    }

    if(ccRecipients && ccRecipients.length > 0){
        mailOptions.cc = ccRecipients;
    }

    await transporter.sendMail(mailOptions);

    console.log(`Email successfully dispatched to: ${recipients.join(", ")}`);
    if (ccRecipients && ccRecipients.length > 0) {
        console.log(`CC successfully dispatched to: ${ccRecipients.join(", ")}`);
    }
}