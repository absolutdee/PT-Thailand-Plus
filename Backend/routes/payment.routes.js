// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { paymentValidation } = require('../validations');
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply authentication to all payment routes
router.use(authenticate);

// Payment Methods
router.get('/methods', paymentController.getPaymentMethods);
router.post('/methods', 
  validate(paymentValidation.addPaymentMethod), 
  paymentController.addPaymentMethod
);
router.put('/methods/:methodId', 
  validate(paymentValidation.updatePaymentMethod), 
  paymentController.updatePaymentMethod
);
router.delete('/methods/:methodId', paymentController.deletePaymentMethod);
router.put('/methods/:methodId/default', paymentController.setDefaultPaymentMethod);

// Credit/Debit Cards
router.post('/cards', 
  rateLimiter,
  validate(paymentValidation.addCard), 
  paymentController.addCard
);
router.delete('/cards/:cardId', paymentController.deleteCard);
router.get('/cards', paymentController.getCards);

// Bank Accounts
router.post('/bank-accounts', 
  rateLimiter,
  validate(paymentValidation.addBankAccount), 
  paymentController.addBankAccount
);
router.delete('/bank-accounts/:accountId', paymentController.deleteBankAccount);
router.get('/bank-accounts', paymentController.getBankAccounts);
router.post('/bank-accounts/:accountId/verify', 
  validate(paymentValidation.verifyBankAccount), 
  paymentController.verifyBankAccount
);

// Digital Wallets
router.post('/wallets/paypal', 
  validate(paymentValidation.linkPayPal), 
  paymentController.linkPayPal
);
router.post('/wallets/stripe', 
  validate(paymentValidation.linkStripe), 
  paymentController.linkStripe
);
router.delete('/wallets/:walletId', paymentController.unlinkWallet);

// Process Payments
router.post('/checkout', 
  rateLimiter,
  validate(paymentValidation.processPayment), 
  paymentController.processPayment
);
router.post('/checkout/session', 
  validate(paymentValidation.createCheckoutSession), 
  paymentController.createCheckoutSession
);
router.post('/checkout/confirm', 
  validate(paymentValidation.confirmPayment), 
  paymentController.confirmPayment
);

// Subscriptions
router.get('/subscriptions', paymentController.getSubscriptions);
router.post('/subscriptions', 
  validate(paymentValidation.createSubscription), 
  paymentController.createSubscription
);
router.put('/subscriptions/:subscriptionId', 
  validate(paymentValidation.updateSubscription), 
  paymentController.updateSubscription
);
router.delete('/subscriptions/:subscriptionId', paymentController.cancelSubscription);
router.put('/subscriptions/:subscriptionId/pause', paymentController.pauseSubscription);
router.put('/subscriptions/:subscriptionId/resume', paymentController.resumeSubscription);

// Payment History
router.get('/transactions', 
  validate(paymentValidation.getTransactions), 
  paymentController.getTransactions
);
router.get('/transactions/:transactionId', paymentController.getTransactionDetails);
router.get('/transactions/:transactionId/receipt', paymentController.getReceipt);
router.post('/transactions/:transactionId/receipt/email', paymentController.emailReceipt);

// Invoices
router.get('/invoices', paymentController.getInvoices);
router.get('/invoices/:invoiceId', paymentController.getInvoiceDetails);
router.get('/invoices/:invoiceId/download', paymentController.downloadInvoice);
router.post('/invoices/:invoiceId/pay', 
  validate(paymentValidation.payInvoice), 
  paymentController.payInvoice
);

// Refunds
router.post('/refunds', 
  validate(paymentValidation.requestRefund), 
  paymentController.requestRefund
);
router.get('/refunds', paymentController.getRefunds);
router.get('/refunds/:refundId', paymentController.getRefundDetails);

// Disputes
router.post('/disputes', 
  validate(paymentValidation.createDispute), 
  paymentController.createDispute
);
router.get('/disputes', paymentController.getDisputes);
router.get('/disputes/:disputeId', paymentController.getDisputeDetails);
router.post('/disputes/:disputeId/evidence', 
  validate(paymentValidation.submitEvidence), 
  paymentController.submitDisputeEvidence
);

// Payouts (for trainers)
router.get('/payouts', paymentController.getPayouts);
router.post('/payouts/request', 
  validate(paymentValidation.requestPayout), 
  paymentController.requestPayout
);
router.get('/payouts/:payoutId', paymentController.getPayoutDetails);
router.get('/payouts/schedule', paymentController.getPayoutSchedule);
router.put('/payouts/schedule', 
  validate(paymentValidation.updatePayoutSchedule), 
  paymentController.updatePayoutSchedule
);

// Wallet Balance
router.get('/wallet/balance', paymentController.getWalletBalance);
router.get('/wallet/transactions', paymentController.getWalletTransactions);
router.post('/wallet/topup', 
  validate(paymentValidation.topUpWallet), 
  paymentController.topUpWallet
);
router.post('/wallet/withdraw', 
  validate(paymentValidation.withdrawFromWallet), 
  paymentController.withdrawFromWallet
);

// Promo Codes & Discounts
router.post('/promo/apply', 
  validate(paymentValidation.applyPromoCode), 
  paymentController.applyPromoCode
);
router.post('/promo/validate', 
  validate(paymentValidation.validatePromoCode), 
  paymentController.validatePromoCode
);
router.delete('/promo/remove', paymentController.removePromoCode);

// Payment Settings
router.get('/settings', paymentController.getPaymentSettings);
router.put('/settings', 
  validate(paymentValidation.updatePaymentSettings), 
  paymentController.updatePaymentSettings
);
router.get('/settings/currencies', paymentController.getSupportedCurrencies);
router.put('/settings/currency', 
  validate(paymentValidation.updateCurrency), 
  paymentController.updateDefaultCurrency
);

// Tax Information
router.get('/tax/info', paymentController.getTaxInfo);
router.put('/tax/info', 
  validate(paymentValidation.updateTaxInfo), 
  paymentController.updateTaxInfo
);
router.get('/tax/documents', paymentController.getTaxDocuments);
router.get('/tax/documents/:year', paymentController.getTaxDocumentsByYear);

// Payment Security
router.post('/security/3ds', 
  validate(paymentValidation.verify3DS), 
  paymentController.verify3DSecure
);
router.post('/security/pin/set', 
  validate(paymentValidation.setPaymentPIN), 
  paymentController.setPaymentPIN
);
router.post('/security/pin/verify', 
  validate(paymentValidation.verifyPaymentPIN), 
  paymentController.verifyPaymentPIN
);
router.put('/security/pin/reset', 
  validate(paymentValidation.resetPaymentPIN), 
  paymentController.resetPaymentPIN
);

// Webhooks (for payment providers)
router.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }), 
  paymentController.handleStripeWebhook
);
router.post('/webhooks/paypal', paymentController.handlePayPalWebhook);

// Reports
router.get('/reports/summary', paymentController.getPaymentSummary);
router.get('/reports/export', 
  validate(paymentValidation.exportReport), 
  paymentController.exportPaymentReport
);

module.exports = router;