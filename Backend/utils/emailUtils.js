// emailUtils.js - Utility functions for email handling

import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import juice from 'juice';
import { formatDateTime } from './dateUtils';
import { encryptData } from './cryptoUtils';

class EmailUtils {
    constructor() {
        this.transporter = null;
        this.templates = new Map();
        this.defaultFrom = process.env.EMAIL_FROM || 'noreply@fitnessplatform.com';
        this.templateDir = path.join(process.cwd(), 'email-templates');
        
        // Initialize transporter
        this.initializeTransporter();
        
        // Register Handlebars helpers
        this.registerHelpers();
    }

    // Initialize email transporter
    initializeTransporter() {
        const config = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };

        this.transporter = nodemailer.createTransporter(config);

        // Verify connection
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('Email transporter error:', error);
            } else {
                console.log('Email server is ready to send messages');
            }
        });
    }

    // Register Handlebars helpers
    registerHelpers() {
        // Format date helper
        handlebars.registerHelper('formatDate', (date, format) => {
            return formatDateTime(date, format || 'MMMM D, YYYY');
        });

        // Conditional helper
        handlebars.registerHelper('ifEquals', (a, b, options) => {
            return a === b ? options.fn(this) : options.inverse(this);
        });

        // Currency helper
        handlebars.registerHelper('currency', (amount) => {
            return new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB',
            }).format(amount);
        });

        // URL helper
        handlebars.registerHelper('url', (path) => {
            const baseUrl = process.env.APP_URL || 'http://localhost:3000';
            return `${baseUrl}${path}`;
        });
    }

    // Load email template
    async loadTemplate(templateName) {
        // Check cache
        if (this.templates.has(templateName)) {
            return this.templates.get(templateName);
        }

        try {
            const templatePath = path.join(this.templateDir, `${templateName}.html`);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            
            // Compile template
            const template = handlebars.compile(templateContent);
            
            // Cache compiled template
            this.templates.set(templateName, template);
            
            return template;
        } catch (error) {
            console.error(`Failed to load template ${templateName}:`, error);
            throw new Error(`Email template ${templateName} not found`);
        }
    }

    // Send email
    async sendEmail(options) {
        const {
            to,
            subject,
            template,
            data = {},
            attachments = [],
            cc,
            bcc,
            replyTo,
            priority = 'normal',
        } = options;

        try {
            // Load and render template
            const templateFn = await this.loadTemplate(template);
            const html = templateFn(data);

            // Inline CSS
            const inlinedHtml = juice(html);

            // Create text version
            const text = this.htmlToText(inlinedHtml);

            // Prepare mail options
            const mailOptions = {
                from: this.defaultFrom,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html: inlinedHtml,
                text,
                attachments,
                priority,
            };

            // Add optional fields
            if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
            if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
            if (replyTo) mailOptions.replyTo = replyTo;

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            // Log email sent
            await this.logEmailSent({
                messageId: info.messageId,
                to,
                subject,
                template,
                timestamp: new Date(),
            });

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error('Email sending error:', error);
            
            // Log failed email
            await this.logEmailFailed({
                to,
                subject,
                template,
                error: error.message,
                timestamp: new Date(),
            });

            throw error;
        }
    }

    // Send welcome email
    async sendWelcomeEmail(user) {
        const data = {
            name: user.name,
            email: user.email,
            role: user.role,
            verificationLink: this.generateVerificationLink(user),
        };

        return this.sendEmail({
            to: user.email,
            subject: 'Welcome to Fitness Platform!',
            template: 'welcome',
            data,
        });
    }

    // Send verification email
    async sendVerificationEmail(user, token) {
        const data = {
            name: user.name,
            verificationLink: `${process.env.APP_URL}/verify-email?token=${token}`,
            expiresIn: '24 hours',
        };

        return this.sendEmail({
            to: user.email,
            subject: 'Verify Your Email Address',
            template: 'verification',
            data,
        });
    }

    // Send password reset email
    async sendPasswordResetEmail(user, token) {
        const data = {
            name: user.name,
            resetLink: `${process.env.APP_URL}/reset-password?token=${token}`,
            expiresIn: '1 hour',
        };

        return this.sendEmail({
            to: user.email,
            subject: 'Reset Your Password',
            template: 'password-reset',
            data,
            priority: 'high',
        });
    }

    // Send appointment confirmation
    async sendAppointmentConfirmation(appointment) {
        const data = {
            clientName: appointment.clientName,
            trainerName: appointment.trainerName,
            date: appointment.date,
            time: appointment.time,
            duration: appointment.duration,
            location: appointment.location,
            sessionType: appointment.type,
            notes: appointment.notes,
            cancelLink: this.generateCancelLink(appointment.id),
            rescheduleLink: this.generateRescheduleLink(appointment.id),
        };

        // Send to client
        await this.sendEmail({
            to: appointment.clientEmail,
            subject: `Appointment Confirmed - ${formatDateTime(appointment.date)}`,
            template: 'appointment-confirmation-client',
            data,
        });

        // Send to trainer
        await this.sendEmail({
            to: appointment.trainerEmail,
            subject: `New Appointment - ${appointment.clientName}`,
            template: 'appointment-confirmation-trainer',
            data,
        });
    }

    // Send appointment reminder
    async sendAppointmentReminder(appointment, reminderType = '24h') {
        const templates = {
            '24h': 'appointment-reminder-24h',
            '2h': 'appointment-reminder-2h',
            '30m': 'appointment-reminder-30m',
        };

        const data = {
            name: appointment.clientName,
            trainerName: appointment.trainerName,
            date: appointment.date,
            time: appointment.time,
            location: appointment.location,
            sessionType: appointment.type,
            joinLink: appointment.isOnline ? appointment.joinLink : null,
        };

        return this.sendEmail({
            to: appointment.clientEmail,
            subject: `Reminder: Appointment ${reminderType === '24h' ? 'Tomorrow' : 'Today'}`,
            template: templates[reminderType],
            data,
        });
    }

    // Send payment receipt
    async sendPaymentReceipt(payment) {
        const data = {
            customerName: payment.customerName,
            invoiceNumber: payment.invoiceNumber,
            date: payment.date,
            amount: payment.amount,
            packageName: payment.packageName,
            packageDetails: payment.packageDetails,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            downloadLink: this.generateReceiptDownloadLink(payment.id),
        };

        return this.sendEmail({
            to: payment.customerEmail,
            subject: `Payment Receipt - Invoice #${payment.invoiceNumber}`,
            template: 'payment-receipt',
            data,
            attachments: [{
                filename: `receipt-${payment.invoiceNumber}.pdf`,
                path: payment.receiptPath,
            }],
        });
    }

    // Send review request
    async sendReviewRequest(session) {
        const data = {
            clientName: session.clientName,
            trainerName: session.trainerName,
            sessionDate: session.date,
            reviewLink: `${process.env.APP_URL}/review/${session.trainerId}?session=${session.id}`,
        };

        return this.sendEmail({
            to: session.clientEmail,
            subject: `How was your session with ${session.trainerName}?`,
            template: 'review-request',
            data,
        });
    }

    // Send bulk emails
    async sendBulkEmails(recipients, subject, template, commonData = {}) {
        const results = [];
        const batchSize = 50; // Send in batches to avoid overwhelming the server

        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            
            const batchPromises = batch.map(recipient => {
                const personalizedData = {
                    ...commonData,
                    ...recipient.data,
                    unsubscribeLink: this.generateUnsubscribeLink(recipient.email),
                };

                return this.sendEmail({
                    to: recipient.email,
                    subject,
                    template,
                    data: personalizedData,
                }).then(result => ({
                    email: recipient.email,
                    success: true,
                    messageId: result.messageId,
                })).catch(error => ({
                    email: recipient.email,
                    success: false,
                    error: error.message,
                }));
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Add delay between batches
            if (i + batchSize < recipients.length) {
                await this.delay(1000);
            }
        }

        return {
            total: recipients.length,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
        };
    }

    // Create email queue job
    async queueEmail(emailData, scheduledFor = null) {
        const job = {
            id: this.generateJobId(),
            data: emailData,
            scheduledFor: scheduledFor || new Date(),
            attempts: 0,
            maxAttempts: 3,
            status: 'pending',
            createdAt: new Date(),
        };

        // In production, this would add to a job queue (Bull, RabbitMQ, etc.)
        // For now, we'll simulate with setTimeout
        if (scheduledFor && scheduledFor > new Date()) {
            const delay = scheduledFor - new Date();
            setTimeout(() => this.processEmailJob(job), delay);
        } else {
            await this.processEmailJob(job);
        }

        return job;
    }

    // Process email job
    async processEmailJob(job) {
        try {
            job.attempts++;
            job.status = 'processing';
            
            const result = await this.sendEmail(job.data);
            
            job.status = 'completed';
            job.completedAt = new Date();
            job.result = result;
        } catch (error) {
            job.lastError = error.message;
            
            if (job.attempts < job.maxAttempts) {
                job.status = 'retrying';
                // Exponential backoff
                const delay = Math.pow(2, job.attempts) * 1000;
                setTimeout(() => this.processEmailJob(job), delay);
            } else {
                job.status = 'failed';
                job.failedAt = new Date();
            }
        }
    }

    // Generate verification link
    generateVerificationLink(user) {
        const token = encryptData(JSON.stringify({
            userId: user.id,
            email: user.email,
            timestamp: Date.now(),
        }));
        
        return `${process.env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
    }

    // Generate unsubscribe link
    generateUnsubscribeLink(email) {
        const token = encryptData(email);
        return `${process.env.APP_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
    }

    // Generate cancel link
    generateCancelLink(appointmentId) {
        return `${process.env.APP_URL}/appointments/${appointmentId}/cancel`;
    }

    // Generate reschedule link
    generateRescheduleLink(appointmentId) {
        return `${process.env.APP_URL}/appointments/${appointmentId}/reschedule`;
    }

    // Generate receipt download link
    generateReceiptDownloadLink(paymentId) {
        return `${process.env.APP_URL}/payments/${paymentId}/receipt`;
    }

    // HTML to text conversion
    htmlToText(html) {
        return html
            .replace(/<style[^>]*>.*?<\/style>/gs, '')
            .replace(/<script[^>]*>.*?<\/script>/gs, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Log email sent
    async logEmailSent(data) {
        // In production, this would log to database or monitoring service
        console.log('Email sent:', data);
    }

    // Log email failed
    async logEmailFailed(data) {
        // In production, this would log to database or monitoring service
        console.error('Email failed:', data);
    }

    // Generate job ID
    generateJobId() {
        return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validate email address
    validateEmailAddress(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Get email statistics
    async getEmailStatistics(startDate, endDate) {
        // In production, this would query from database
        return {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            complained: 0,
        };
    }
}

// Export singleton instance
const emailUtils = new EmailUtils();
export default emailUtils;

// Export individual functions
export const {
    sendEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendPaymentReceipt,
    sendReviewRequest,
    sendBulkEmails,
    queueEmail,
    validateEmailAddress,
    getEmailStatistics,
} = emailUtils;
