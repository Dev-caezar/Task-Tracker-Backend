import Brevo from "sib-api-v3-sdk";
import apiInstance from "../config/brevo.js";

export const sendSingleEmail = async (options) => {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.to = [{ email: options.email }];
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME,
      email: process.env.BREVO_SENDER_EMAIL,
    };
    sendSmtpEmail.htmlContent = options.html;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Email sent to:", options.email);
    return data;
  } catch (error) {
    console.error("Brevo error:", error.response?.body || error.message);
    throw new Error("Email not sent");
  }
};
