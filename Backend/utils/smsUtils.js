// smsUtils.js - Utility functions for SMS handling

import twilio from 'twilio';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { formatDateTime } from './dateUtils';
import { encryptData, decryptData } from './cryptoUtils';

class SMSUtils {
    constructor() {
        this.client = null;
        this.defaultCountryCode = 'TH';
        this.maxSMSLength = 160;
        this.maxConcatenatedSMS = 3;
        this.templates = new Map();
        this.rateLimits = new Map();
        
        // Initialize Twilio client
        this.initializeTwilio();
        
        // Load SMS templates
        this.loadTemplates();
    }

    // Initialize Twilio client
    initializeTwilio() {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
            this.defaultFrom = process.env.TWILIO_PHONE_NUMBER;
            console.log('Twilio client initialized');
        } else {
            console.warn('Twilio credentials not found. SMS functionality will be limited.');
        }
    }

    // Load SMS templates
    loadTemplates() {
        // Verification code template
        this.templates.set('verification', {
            th: 'รหัสยืนยันของคุณคือ: {{code}} (หมดอายุใน {{expiry}} นาที)',
            en: 'Your verification code is: {{code}} (expires in {{expiry}} minutes)',
        });

        // Appointment reminder template
        this.templates.set('appointment-reminder', {
            th: 'เตือนนัดหมาย: {{date}} เวลา {{time}} กับ {{trainer}} ที่ {{location}}',
            en: 'Appointment reminder: {{date}} at {{time}} with {{trainer}} at {{location}}',
        });

        // Payment confirmation template
        this.templates.set('payment-confirmation', {
            th: 'ชำระเงินสำเร็จ {{amount}} บาท สำหรับ {{package}} ใบเสร็จ: {{receipt}}',
            en: 'Payment confirmed: {{amount}} THB for {{package}}. Receipt: {{receipt}}',
        });

        // Session cancelled template
        this.templates.set('session-cancelled', {
            th: 'การเทรนวันที่ {{date}} เวลา {{time}} ถูกยกเลิก กรุณาติดต่อเทรนเนอร์',
            en: 'Your training session on {{date}} at {{time}} has been cancelled. Please contact your trainer.',
        });

        // Custom message template
        this.templates.set('custom', {
            th: '{{message}}',
            en: '{{message}}',
        });
    }

    // Send SMS
    async sendSMS(to, message, options = {}) {
        try {
            // Validate phone number
            const validatedPhone = this.validateAndFormatPhone(to);
            if (!validatedPhone.valid) {
                throw new Error(`Invalid phone number: ${validatedPhone.error}`);
            }

            // Check rate limits
            if (!this.checkRateLimit(validatedPhone.number)) {
                throw new Error('Rate limit exceeded for this number');
            }

            // Ensure message is within limits
            const processedMessage = this.processMessage(message);

            // Send SMS
            const result = await this.client.messages.create({
                body: processedMessage,
                from: options.from || this.defaultFrom,
                to: validatedPhone.number,
                statusCallback: options.statusCallback,
            });

            // Log SMS sent
            await this.logSMS({
                messageId: result.sid,
                to: validatedPhone.number,
                message: processedMessage,
                status: result.status,
                timestamp: new Date(),
            });

            // Update rate limit
            this.updateRateLimit(validatedPhone.number);

            return {
                success: true,
                messageId: result.sid,
                to: validatedPhone.number,
                segmentCount: Math.ceil(processedMessage.length / this.maxSMSLength),
            };
        } catch (error) {
            console.error('SMS sending error:', error);
            
            // Log failed SMS
            await this.logSMSFailed({
                to,
                message,
                error: error.message,
                timestamp: new Date(),
            });

            throw error;
        }
    }

    // Send verification code
    async sendVerificationCode(phoneNumber, code, expiryMinutes = 10) {
        const message = this.renderTemplate('verification', {
            code,
            expiry: expiryMinutes,
        });

        return this.sendSMS(phoneNumber, message, {
            priority: 'high',
        });
    }

    // Send appointment reminder
    async sendAppointmentReminder(appointment) {
        const message = this.renderTemplate('appointment-reminder', {
            date: formatDateTime(appointment.date, 'DD/MM/YYYY'),
            time: formatDateTime(appointment.startTime, 'HH:mm'),
            trainer: appointment.trainerName,
            location: appointment.location,
        }, appointment.language);

        return this.sendSMS(appointment.clientPhone, message);
    }

    // Send payment confirmation
    async sendPaymentConfirmation(payment) {
        const message = this.renderTemplate('payment-confirmation', {
            amount: payment.amount.toLocaleString(),
            package: payment.packageName,
            receipt: payment.receiptNumber,
        }, payment.language);

        return this.sendSMS(payment.customerPhone, message);
    }

    // Send bulk SMS
    async sendBulkSMS(recipients, template, data = {}) {
        const results = [];
        const batchSize = 100; // Twilio recommended batch size

        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            
            const batchPromises = batch.map(recipient => {
                const personalizedData = {
                    ...data,
                    ...recipient.data,
                };

                const message = this.renderTemplate(template, personalizedData, recipient.language);

                return this.sendSMS(recipient.phone, message)
                    .then(result => ({
                        phone: recipient.phone,
                        success: true,
                        messageId: result.messageId,
                    }))
                    .catch(error => ({
                        phone: recipient.phone,
                        success: false,
                        error: error.message,
                    }));
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Add delay between batches
            if (i + batchSize < recipients.length) {
                await this.delay(2000); // 2 second delay
            }
        }

        return {
            total: recipients.length,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
        };
    }

    // Validate and format phone number
    validateAndFormatPhone(phoneNumber, countryCode = this.defaultCountryCode) {
        try {
            // Remove any non-digit characters except +
            const cleaned = phoneNumber.replace(/[^\d+]/g, '');

            // Check if valid
            if (!isValidPhoneNumber(cleaned, countryCode)) {
                return {
                    valid: false,
                    error: 'Invalid phone number format',
                };
            }

            // Parse and format
            const parsed = parsePhoneNumber(cleaned, countryCode);
            
            return {
                valid: true,
                number: parsed.format('E.164'),
                national: parsed.format('NATIONAL'),
                international: parsed.format('INTERNATIONAL'),
                country: parsed.country,
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
            };
        }
    }

    // Process message (handle length, encoding, etc.)
    processMessage(message) {
        // Remove extra whitespace
        let processed = message.trim().replace(/\s+/g, ' ');

        // Check if message contains Unicode (Thai characters)
        const hasUnicode = /[^\x00-\x7F]/.test(processed);
        const maxLength = hasUnicode ? 70 : this.maxSMSLength;

        // Truncate if too long
        const maxTotalLength = maxLength * this.maxConcatenatedSMS;
        if (processed.length > maxTotalLength) {
            processed = processed.substring(0, maxTotalLength - 3) + '...';
        }

        return processed;
    }

    // Render template
    renderTemplate(templateName, data = {}, language = 'th') {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template ${templateName} not found`);
        }

        let message = template[language] || template['en'];

        // Replace placeholders
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            message = message.replace(regex, data[key]);
        });

        return message;
    }

    // Check rate limits
    checkRateLimit(phoneNumber) {
        const now = Date.now();
        const limits = this.rateLimits.get(phoneNumber) || { count: 0, resetTime: now };

        // Reset if time has passed (1 hour window)
        if (now > limits.resetTime) {
            limits.count = 0;
            limits.resetTime = now + 3600000; // 1 hour
        }

        // Check if under limit (10 messages per hour)
        if (limits.count >= 10) {
            return false;
        }

        return true;
    }

    // Update rate limit
    updateRateLimit(phoneNumber) {
        const now = Date.now();
        const limits = this.rateLimits.get(phoneNumber) || { count: 0, resetTime: now + 3600000 };
        
        limits.count++;
        this.rateLimits.set(phoneNumber, limits);
    }

    // Schedule SMS
    async scheduleSMS(to, message, scheduledTime, options = {}) {
        const job = {
            id: this.generateJobId(),
            to,
            message,
            scheduledTime,
            options,
            status: 'scheduled',
            createdAt: new Date(),
        };

        // Calculate delay
        const delay = new Date(scheduledTime) - new Date();
        
        if (delay <= 0) {
            // Send immediately
            return this.sendSMS(to, message, options);
        }

        // Schedule for later
        setTimeout(async () => {
            try {
                await this.sendSMS(to, message, options);
                job.status = 'sent';
                job.sentAt = new Date();
            } catch (error) {
                job.status = 'failed';
                job.error = error.message;
            }
        }, delay);

        return job;
    }

    // Get SMS status
    async getSMSStatus(messageId) {
        try {
            const message = await this.client.messages(messageId).fetch();
            
            return {
                messageId: message.sid,
                status: message.status,
                to: message.to,
                from: message.from,
                dateSent: message.dateSent,
                dateCreated: message.dateCreated,
                direction: message.direction,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage,
                price: message.price,
                priceUnit: message.priceUnit,
            };
        } catch (error) {
            console.error('Error fetching SMS status:', error);
            throw error;
        }
    }

    // Handle incoming SMS (webhook)
    async handleIncomingSMS(data) {
        const { From, To, Body, MessageSid } = data;

        // Log incoming message
        await this.logIncomingSMS({
            messageId: MessageSid,
            from: From,
            to: To,
            body: Body,
            timestamp: new Date(),
        });

        // Process commands
        const command = this.parseCommand(Body);
        if (command) {
            await this.processCommand(From, command);
        }

        return {
            received: true,
            messageId: MessageSid,
        };
    }

    // Parse SMS commands
    parseCommand(message) {
        const commands = {
            'STOP': 'unsubscribe',
            'START': 'subscribe',
            'HELP': 'help',
            'INFO': 'info',
        };

        const upperMessage = message.trim().toUpperCase();
        return commands[upperMessage] || null;
    }

    // Process SMS commands
    async processCommand(from, command) {
        switch (command) {
            case 'unsubscribe':
                await this.unsubscribeNumber(from);
                await this.sendSMS(from, 'คุณได้ยกเลิกการรับ SMS แล้ว / You have been unsubscribed.');
                break;
            
            case 'subscribe':
                await this.subscribeNumber(from);
                await this.sendSMS(from, 'ยินดีต้อนรับ! คุณจะได้รับ SMS จากเรา / Welcome! You will receive SMS from us.');
                break;
            
            case 'help':
                await this.sendSMS(from, 'Commands: STOP=unsubscribe, START=subscribe, INFO=information');
                break;
            
            case 'info':
                await this.sendSMS(from, 'Fitness Platform - For support call 02-xxx-xxxx');
                break;
        }
    }

    // Unsubscribe number
    async unsubscribeNumber(phoneNumber) {
        // In production, this would update database
        console.log(`Unsubscribed: ${phoneNumber}`);
    }

    // Subscribe number
    async subscribeNumber(phoneNumber) {
        // In production, this would update database
        console.log(`Subscribed: ${phoneNumber}`);
    }

    // Generate OTP
    generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        
        return otp;
    }

    // Verify OTP
    async verifyOTP(phoneNumber, inputOTP, storedOTP, expiryTime) {
        // Check expiry
        if (new Date() > new Date(expiryTime)) {
            return {
                valid: false,
                error: 'OTP has expired',
            };
        }

        // Check OTP
        if (inputOTP !== storedOTP) {
            return {
                valid: false,
                error: 'Invalid OTP',
            };
        }

        return {
            valid: true,
        };
    }

    // Log SMS
    async logSMS(data) {
        // In production, this would log to database
        console.log('SMS sent:', data);
    }

    // Log failed SMS
    async logSMSFailed(data) {
        // In production, this would log to database
        console.error('SMS failed:', data);
    }

    // Log incoming SMS
    async logIncomingSMS(data) {
        // In production, this would log to database
        console.log('SMS received:', data);
    }

    // Generate job ID
    generateJobId() {
        return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get SMS statistics
    async getSMSStatistics(startDate, endDate) {
        // In production, this would query from database
        return {
            sent: 0,
            delivered: 0,
            failed: 0,
            received: 0,
            cost: 0,
        };
    }

    // Calculate SMS cost
    calculateSMSCost(message, recipients = 1) {
        const hasUnicode = /[^\x00-\x7F]/.test(message);
        const charLimit = hasUnicode ? 70 : this.maxSMSLength;
        const segments = Math.ceil(message.length / charLimit);
        const costPerSegment = 0.50; // THB per segment
        
        return {
            segments,
            costPerRecipient: segments * costPerSegment,
            totalCost: segments * costPerSegment * recipients,
            currency: 'THB',
        };
    }
}

// Export singleton instance
const smsUtils = new SMSUtils();
export default smsUtils;

// Export individual functions
export const {
    sendSMS,
    sendVerificationCode,
    sendAppointmentReminder,
    sendPaymentConfirmation,
    sendBulkSMS,
    validateAndFormatPhone,
    scheduleSMS,
    getSMSStatus,
    handleIncomingSMS,
    generateOTP,
    verifyOTP,
    calculateSMSCost,
    getSMSStatistics,
} = smsUtils;
