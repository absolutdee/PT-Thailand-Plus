// backend/src/services/email/config/templateConfig.js
export const EMAIL_TEMPLATES = {
  customer: {
    welcome: 'customer/welcome-customer.html',
    bookingConfirmation: 'customer/booking-confirmation.html',
    trainingReminder: 'customer/training-reminder.html',
    paymentConfirmation: 'customer/payment-confirmation.html',
    packageExpiry: 'customer/package-expiry.html',
    monthlyReport: 'customer/monthly-report.html',
    reviewRequest: 'customer/review-request.html'
  },
  trainer: {
    welcome: 'trainer/welcome-trainer.html',
    approval: 'trainer/trainer-approval.html',
    bookingNotification: 'trainer/trainer-booking-notification.html'
  },
  shared: {
    passwordReset: 'shared/password-reset.html',
    messageNotification: 'shared/new-message-notification.html',
    appointmentCancellation: 'shared/appointment-cancellation.html',
    scheduleChange: 'shared/schedule-change.html',
    paymentFailed: 'shared/payment-failed.html',
    newsletter: 'shared/newsletter-promotion.html'
  }
};
