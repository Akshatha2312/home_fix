import { sendEmail as sendSmtpEmail } from "../utils/email.js";

// Email templates
const templates = {
  bookingConfirmation: (booking, provider) => ({
    subject: `Booking Confirmed - ${booking.serviceType}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🏠 HomeFix</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Booking Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Your booking has been confirmed!</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p><strong>Service:</strong> ${booking.serviceType}</p>
            <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.bookingTime}</p>
            <p><strong>Estimated Cost:</strong> ₹${booking.estimatedCost}</p>
          </div>
          <p style="color: #64748b; margin-top: 20px; font-size: 14px;">Thank you for choosing HomeFix!</p>
        </div>
      </div>
    `,
  }),

  bookingRequest: (booking, customer) => ({
    subject: `New Booking Request - ${booking.serviceType}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🏠 HomeFix</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">New Booking Request</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">You have a new booking request!</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p><strong>Customer:</strong> ${customer?.name || "Customer"}</p>
            <p><strong>Service:</strong> ${booking.serviceType}</p>
            <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.bookingTime}</p>
            <p><strong>Description:</strong> ${booking.problemDescription || "No description provided"}</p>
          </div>
        </div>
      </div>
    `,
  }),

  paymentConfirmation: (payment) => ({
    subject: `Payment Received - ₹${payment.amount}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🏠 HomeFix</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Payment Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Payment Successful! ✅</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p><strong>Amount:</strong> ₹${payment.amount}</p>
            <p><strong>Payment ID:</strong> ${payment.razorpayPaymentId}</p>
            <p><strong>Status:</strong> Successful</p>
          </div>
        </div>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, templateName, data) => {
  try {
    const template = templates[templateName];

    if (!template) {
      console.error(`Email template '${templateName}' not found`);
      return { success: false, message: "Template not found" };
    }

    const { subject, html } = template(...data);
    return await sendSmtpEmail({ to, subject, html });
  } catch (error) {
    console.error(`❌ Email error: ${error.message}`);
    return { success: false, message: error.message };
  }
};

export default { sendEmail };
