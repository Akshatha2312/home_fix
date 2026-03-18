import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

let transporter;

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };
};

const getTransporter = () => {
  if (transporter) return transporter;

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) return null;

  transporter = nodemailer.createTransport(smtpConfig);
  return transporter;
};

const getFromAddress = () => {
  const fromName = process.env.EMAIL_FROM_NAME || "HomeFix";
  const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.SMTP_USER;

  if (!fromEmail) return undefined;
  return `"${fromName}" <${fromEmail}>`;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailTransporter = getTransporter();

    if (!mailTransporter) {
      console.warn(
        "SMTP config is missing (SMTP_HOST / SMTP_USER / SMTP_PASS). Email sending skipped.",
      );
      console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
      return { success: true, message: "Email skipped (missing SMTP config)" };
    }

    await mailTransporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully via SMTP to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: error.message };
  }
};
