export const bookingCreatedTemplate = (booking) => {
  const mapLink = booking.coordinates?.lat
    ? `<p><a href="https://www.google.com/maps?q=${booking.coordinates.lat},${booking.coordinates.lng}" style="color: #2196F3; text-decoration: underline;">View Customer Location on Google Maps</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">New Booking Request</h2>
      <p>Hello ${booking.providerName},</p>
      <p>You have received a new booking request.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>Customer Phone:</strong> <a href="tel:${booking.customerPhone}" style="color: #2196F3;">${booking.customerPhone}</a></p>
        <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.bookingTime}</p>
        <p><strong>Location:</strong> ${booking.address?.street || "N/A"}, ${booking.address?.area || "N/A"}, ${booking.address?.city || "Bangalore"} - ${booking.address?.pincode || "N/A"}</p>
        <p><strong>Landmark:</strong> ${booking.address?.landmark || "N/A"}</p>
        ${mapLink}
      </div>
      <p>Please log in to your dashboard to accept or reject this request.</p>
    </div>
  `;
};

export const bookingConfirmationTemplate = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Booking Confirmation</h2>
      <p>Hello ${booking.customerName},</p>
      <p>Your booking request has been sent successfully.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Provider:</strong> ${booking.providerName}</p>
        <p><strong>Provider Phone:</strong> <a href="tel:${booking.providerPhone}" style="color: #2196F3;">${booking.providerPhone}</a></p>
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.bookingTime}</p>
        <p><strong>Location:</strong> ${booking.address?.street || "N/A"}, ${booking.address?.area || "N/A"}, ${booking.address?.city || "Bangalore"} - ${booking.address?.pincode || "N/A"}</p>
      </div>
      <p>You will be notified once the provider accepts your request.</p>
    </div>
  `;
};

export const bookingAcceptedTemplate = (booking) => {
  const mapLink = booking.coordinates?.lat
    ? `<p><a href="https://www.google.com/maps?q=${booking.coordinates.lat},${booking.coordinates.lng}" style="color: #2196F3; text-decoration: underline;">📍 View Location on Google Maps</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Booking Accepted!</h2>
      <p>Hello ${booking.customerName},</p>
      <p>Great news! Your booking has been accepted by <strong>${booking.providerName}</strong>.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Provider Phone:</strong> <a href="tel:${booking.providerPhone}" style="color: #2196F3;">${booking.providerPhone}</a></p>
        <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.bookingTime}</p>
        <p><strong>Location:</strong> ${booking.address?.street || "N/A"}, ${booking.address?.area || "N/A"}, ${booking.address?.city || "Bangalore"} - ${booking.address?.pincode || "N/A"}</p>
        ${mapLink}
      </div>
      <p>Please be ready at the scheduled time.</p>
    </div>
  `;
};

export const bookingRejectedTemplate = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F44336;">Booking Update</h2>
      <p>Hello ${booking.customerName},</p>
      <p>Unfortunately, your booking request with <strong>${booking.providerName}</strong> was not accepted.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.bookingTime}</p>
      </div>
      <p>This could be due to scheduling conflicts or availability.</p>
      <p>Please try booking another provider for your service needs.</p>
    </div>
  `;
};

export const bookingCancelledTemplateProvider = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F44336;">Booking Cancelled</h2>
      <p>Hello ${booking.providerName},</p>
      <p>The following booking has been cancelled by the customer:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>Customer Phone:</strong> <a href="tel:${booking.customerPhone}" style="color: #2196F3;">${booking.customerPhone}</a></p>
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
        <p><strong>Reason:</strong> ${booking.cancellationReason || "No reason provided"}</p>
      </div>
    </div>
  `;
};

export const bookingCancelledTemplateCustomer = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F44336;">Cancellation Confirmed</h2>
      <p>Hello ${booking.customerName},</p>
      <p>Your booking with <strong>${booking.providerName}</strong> has been cancelled successfully.</p>
      <p>We hope to serve you again soon.</p>
    </div>
  `;
};

export const paymentSuccessTemplate = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Payment Successful</h2>
      <p>Hello ${booking.customerName},</p>
      <p>We have received your payment for the service provided by <strong>${booking.providerName}</strong>.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Amount:</strong> ₹${booking.amount}</p>
        <p><strong>Transaction ID:</strong> ${booking.paymentId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p>Thank you for choosing HomeFix!</p>
    </div>
  `;
};

export const paymentReceivedTemplate = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Payment Received</h2>
      <p>Hello ${booking.providerName},</p>
      <p>You have received a payment for your service.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Amount:</strong> ₹${booking.amount}</p>
        <p><strong>Transaction ID:</strong> ${booking.paymentId}</p>
      </div>
    </div>
  `;
};

export const ratingReceivedTemplate = (review) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FFC107;">New Rating Received!</h2>
      <p>Hello ${review.providerName},</p>
      <p>You received a new rating from <strong>${review.customerName}</strong>.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Rating:</strong> ${review.rating} / 5</p>
        <p><strong>Review:</strong> "${review.comment}"</p>
      </div>
      <p>Keep up the good work!</p>
    </div>
  `;
};
export const forgotPasswordTemplate = (resetUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
      <p>Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center;">
        <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>Thank you,<br>HomeFix Team</p>
    </div>
  `;
};
