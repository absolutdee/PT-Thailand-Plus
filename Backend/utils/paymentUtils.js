// utils/paymentUtils.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29'
});
const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/database');

const paymentUtils = {
  // Process payment based on method
  processPayment: async (paymentData) => {
    const {
      amount,
      currency = 'THB',
      method,
      source,
      customerId,
      description,
      metadata = {}
    } = paymentData;

    let result;

    switch (method) {
      case 'credit_card':
        result = await paymentUtils.processCreditCard(paymentData);
        break;
      
      case 'promptpay':
        result = await paymentUtils.processPromptPay(paymentData);
        break;
      
      case 'bank_transfer':
        result = await paymentUtils.processBankTransfer(paymentData);
        break;
      
      case 'true_money':
        result = await paymentUtils.processTrueMoney(paymentData);
        break;
      
      case 'installment':
        result = await paymentUtils.processInstallment(paymentData);
        break;
      
      default:
        throw new Error('Unsupported payment method');
    }

    // Record payment in database
    if (result.success) {
      await paymentUtils.recordPayment({
        ...paymentData,
        transactionId: result.transactionId,
        status: result.status,
        responseData: result.data
      });
    }

    return result;
  },

  // Process credit card payment
  processCreditCard: async (paymentData) => {
    try {
      if (process.env.PAYMENT_PROVIDER === 'stripe') {
        // Stripe implementation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: paymentData.amount * 100, // Convert to cents
          currency: paymentData.currency.toLowerCase(),
          payment_method: paymentData.source,
          confirm: true,
          description: paymentData.description,
          metadata: paymentData.metadata,
          customer: paymentData.stripeCustomerId
        });

        return {
          success: paymentIntent.status === 'succeeded',
          transactionId: paymentIntent.id,
          status: paymentIntent.status,
          data: paymentIntent
        };

      } else if (process.env.PAYMENT_PROVIDER === 'omise') {
        // Omise implementation
        const charge = await omise.charges.create({
          amount: paymentData.amount * 100, // Convert to satang
          currency: paymentData.currency,
          card: paymentData.source,
          description: paymentData.description,
          metadata: paymentData.metadata
        });

        return {
          success: charge.status === 'successful',
          transactionId: charge.id,
          status: charge.status,
          data: charge
        };
      }

    } catch (error) {
      console.error('Credit card payment error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  },

  // Process PromptPay payment
  processPromptPay: async (paymentData) => {
    try {
      if (process.env.PAYMENT_PROVIDER === 'omise') {
        const source = await omise.sources.create({
          type: 'promptpay',
          amount: paymentData.amount * 100,
          currency: 'THB'
        });

        const charge = await omise.charges.create({
          amount: paymentData.amount * 100,
          currency: 'THB',
          source: source.id,
          description: paymentData.description,
          metadata: paymentData.metadata
        });

        return {
          success: charge.status === 'pending',
          transactionId: charge.id,
          status: charge.status,
          qrCode: source.scannable_code?.image?.download_uri,
          data: charge
        };
      }

      // Alternative PromptPay implementation
      const qrData = await paymentUtils.generatePromptPayQR({
        amount: paymentData.amount,
        promptPayId: process.env.PROMPTPAY_ID,
        billerId: paymentData.metadata.bookingId
      });

      return {
        success: true,
        transactionId: crypto.randomBytes(16).toString('hex'),
        status: 'pending',
        qrCode: qrData.qrCode,
        data: qrData
      };

    } catch (error) {
      console.error('PromptPay payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Process bank transfer
  processBankTransfer: async (paymentData) => {
    try {
      // Generate payment reference
      const reference = paymentUtils.generatePaymentReference();

      // Create pending payment record
      const [result] = await db.execute(`
        INSERT INTO bank_transfers (
          reference_code, amount, customer_id,
          bank_account, status, expires_at,
          created_at
        ) VALUES (?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())
      `, [
        reference,
        paymentData.amount,
        paymentData.customerId,
        process.env.COMPANY_BANK_ACCOUNT
      ]);

      return {
        success: true,
        transactionId: reference,
        status: 'pending',
        data: {
          reference,
          bankAccount: process.env.COMPANY_BANK_ACCOUNT,
          bankName: process.env.COMPANY_BANK_NAME,
          accountName: process.env.COMPANY_ACCOUNT_NAME,
          amount: paymentData.amount,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      };

    } catch (error) {
      console.error('Bank transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Process True Money Wallet
  processTrueMoney: async (paymentData) => {
    try {
      const response = await axios.post(process.env.TRUEMONEY_API_URL, {
        amount: paymentData.amount,
        currency: 'THB',
        description: paymentData.description,
        sourceOfFund: {
          type: 'truemoney',
          phoneNumber: paymentData.phoneNumber
        },
        redirectUrl: `${process.env.APP_URL}/payment/callback`
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TRUEMONEY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        status: 'pending',
        redirectUrl: response.data.paymentUrl,
        data: response.data
      };

    } catch (error) {
      console.error('True Money payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Process installment payment
  processInstallment: async (paymentData) => {
    try {
      const {
        amount,
        installmentTerms,
        interestRate = 0
      } = paymentData;

      // Calculate installment details
      const monthlyInterest = interestRate / 100 / 12;
      const totalMonths = installmentTerms;
      const monthlyPayment = monthlyInterest > 0
        ? (amount * monthlyInterest * Math.pow(1 + monthlyInterest, totalMonths)) / 
          (Math.pow(1 + monthlyInterest, totalMonths) - 1)
        : amount / totalMonths;

      const totalAmount = monthlyPayment * totalMonths;
      const totalInterest = totalAmount - amount;

      if (process.env.PAYMENT_PROVIDER === 'omise') {
        const source = await omise.sources.create({
          type: 'installment_bay',
          amount: amount * 100,
          currency: 'THB',
          installment_term: installmentTerms
        });

        const charge = await omise.charges.create({
          amount: amount * 100,
          currency: 'THB',
          source: source.id,
          description: paymentData.description,
          metadata: {
            ...paymentData.metadata,
            installment_terms: installmentTerms,
            monthly_payment: monthlyPayment
          }
        });

        return {
          success: charge.status === 'pending',
          transactionId: charge.id,
          status: charge.status,
          data: {
            ...charge,
            installmentDetails: {
              terms: installmentTerms,
              monthlyPayment,
              totalAmount,
              totalInterest
            }
          }
        };
      }

      return {
        success: false,
        error: 'Installment provider not configured'
      };

    } catch (error) {
      console.error('Installment payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Generate payment reference
  generatePaymentReference: () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `PAY${timestamp}${random}`;
  },

  // Generate PromptPay QR Code
  generatePromptPayQR: async (data) => {
    const { amount, promptPayId, billerId } = data;

    // PromptPay QR data format
    const payload = [
      '00020101021129370016A000000677010111',
      promptPayId.length === 13 ? '0213' : '0113',
      promptPayId,
      '5303764',
      '5406' + amount.toFixed(2),
      '5802TH',
      billerId ? `62${billerId.length.toString().padStart(2, '0')}${billerId}` : '',
      '6304'
    ].join('');

    // Calculate CRC
    const crc = paymentUtils.calculateCRC16(payload);
    const qrData = payload + crc;

    // Generate QR code image
    const QRCode = require('qrcode');
    const qrCode = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2
    });

    return {
      qrCode,
      qrData,
      amount,
      promptPayId
    };
  },

  // Calculate CRC16 for PromptPay
  calculateCRC16: (data) => {
    const crcTable = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0x1021 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[i] = c;
    }

    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      const c = data.charCodeAt(i);
      crc = (crcTable[(c ^ crc) & 0xFF] ^ (crc >>> 8)) & 0xFFFF;
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  },

  // Record payment in database
  recordPayment: async (paymentData) => {
    const {
      customerId,
      trainerId,
      bookingId,
      packageId,
      amount,
      method,
      transactionId,
      status,
      responseData
    } = paymentData;

    const [result] = await db.execute(`
      INSERT INTO payments (
        customer_id, trainer_id, booking_id, package_id,
        amount, payment_method, transaction_id,
        status, response_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      customerId,
      trainerId,
      bookingId,
      packageId,
      amount,
      method,
      transactionId,
      status,
      JSON.stringify(responseData)
    ]);

    return result.insertId;
  },

  // Verify payment status
  verifyPayment: async (transactionId, provider) => {
    try {
      if (provider === 'stripe') {
        const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
        return {
          verified: true,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          data: paymentIntent
        };

      } else if (provider === 'omise') {
        const charge = await omise.charges.retrieve(transactionId);
        return {
          verified: true,
          status: charge.status,
          amount: charge.amount / 100,
          data: charge
        };
      }

      return {
        verified: false,
        error: 'Unknown payment provider'
      };

    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  },

  // Process refund
  processRefund: async (paymentId, amount, reason) => {
    try {
      // Get payment details
      const [payments] = await db.execute(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (payments.length === 0) {
        throw new Error('Payment not found');
      }

      const payment = payments[0];
      const refundAmount = amount || payment.amount;

      let result;

      if (payment.payment_method === 'credit_card') {
        if (process.env.PAYMENT_PROVIDER === 'stripe') {
          const refund = await stripe.refunds.create({
            payment_intent: payment.transaction_id,
            amount: refundAmount * 100,
            reason: reason || 'requested_by_customer'
          });

          result = {
            success: refund.status === 'succeeded',
            refundId: refund.id,
            amount: refund.amount / 100
          };

        } else if (process.env.PAYMENT_PROVIDER === 'omise') {
          const refund = await omise.refunds.create(payment.transaction_id, {
            amount: refundAmount * 100
          });

          result = {
            success: true,
            refundId: refund.id,
            amount: refund.amount / 100
          };
        }
      }

      // Record refund
      if (result.success) {
        await db.execute(`
          INSERT INTO refunds (
            payment_id, amount, reason,
            refund_id, status, created_at
          ) VALUES (?, ?, ?, ?, 'completed', NOW())
        `, [paymentId, refundAmount, reason, result.refundId]);
      }

      return result;

    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Calculate platform fee
  calculatePlatformFee: (amount, feePercentage = 15) => {
    const fee = amount * (feePercentage / 100);
    const netAmount = amount - fee;

    return {
      grossAmount: amount,
      platformFee: Math.round(fee * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      feePercentage
    };
  },

  // Create payout to trainer
  createPayout: async (trainerId, amount, method = 'bank_transfer') => {
    try {
      // Get trainer bank account
      const [trainer] = await db.execute(`
        SELECT t.*, ba.* 
        FROM trainers t
        JOIN bank_accounts ba ON t.id = ba.trainer_id
        WHERE t.id = ? AND ba.is_default = 1
      `, [trainerId]);

      if (trainer.length === 0) {
        throw new Error('Trainer bank account not found');
      }

      const bankAccount = trainer[0];

      // Create payout record
      const [result] = await db.execute(`
        INSERT INTO payouts (
          trainer_id, amount, method,
          bank_account_id, status,
          scheduled_date, created_at
        ) VALUES (?, ?, ?, ?, 'scheduled', DATE_ADD(NOW(), INTERVAL 3 DAY), NOW())
      `, [
        trainerId,
        amount,
        method,
        bankAccount.id
      ]);

      return {
        success: true,
        payoutId: result.insertId,
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      console.error('Create payout error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Validate credit card
  validateCreditCard: (cardNumber) => {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if all characters are digits
    if (!/^\d+$/.test(cleaned)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  // Get card type
  getCardType: (cardNumber) => {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      jcb: /^35/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleaned)) {
        return type;
      }
    }

    return 'unknown';
  },

  // Format currency
  formatCurrency: (amount, currency = 'THB') => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Get payment method display name
  getPaymentMethodName: (method) => {
    const names = {
      credit_card: 'บัตรเครดิต/เดบิต',
      promptpay: 'พร้อมเพย์',
      bank_transfer: 'โอนเงินผ่านธนาคาร',
      true_money: 'TrueMoney Wallet',
      installment: 'ผ่อนชำระ',
      cash: 'เงินสด'
    };

    return names[method] || method;
  }
};

module.exports = paymentUtils;
