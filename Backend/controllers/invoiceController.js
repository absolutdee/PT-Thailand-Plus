// invoiceController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const invoiceController = {
  // ดึงรายการใบแจ้งหนี้ทั้งหมด
  getAllInvoices: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all',
        type = 'all',
        trainerId = 'all',
        customerId = 'all',
        dateFrom,
        dateTo,
        search = '',
        sortBy = 'created_at',
        order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT i.*,
               c.first_name as customer_name,
               c.last_name as customer_lastname,
               c.email as customer_email,
               t.display_name as trainer_name,
               u.first_name as trainer_firstname,
               u.last_name as trainer_lastname,
               p.amount as payment_amount,
               p.status as payment_status
        FROM invoices i
        LEFT JOIN users c ON i.customer_id = c.id
        LEFT JOIN trainers t ON i.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN payments p ON i.payment_id = p.id
        WHERE 1=1
      `;

      const queryParams = [];

      // Status filter
      if (status !== 'all') {
        query += ` AND i.status = ?`;
        queryParams.push(status);
      }

      // Type filter
      if (type !== 'all') {
        query += ` AND i.type = ?`;
        queryParams.push(type);
      }

      // Trainer filter
      if (trainerId !== 'all') {
        query += ` AND i.trainer_id = ?`;
        queryParams.push(trainerId);
      }

      // Customer filter
      if (customerId !== 'all') {
        query += ` AND i.customer_id = ?`;
        queryParams.push(customerId);
      }

      // Date range filter
      if (dateFrom) {
        query += ` AND i.invoice_date >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND i.invoice_date <= ?`;
        queryParams.push(dateTo);
      }

      // Search filter
      if (search) {
        query += ` AND (i.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Sorting
      const allowedSortFields = ['created_at', 'invoice_date', 'due_date', 'total_amount', 'invoice_number'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      query += ` ORDER BY i.${sortField} ${order === 'ASC' ? 'ASC' : 'DESC'}`;

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [invoices] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM invoices i WHERE 1=1`;
      const countParams = [];

      if (status !== 'all') {
        countQuery += ` AND i.status = ?`;
        countParams.push(status);
      }

      if (type !== 'all') {
        countQuery += ` AND i.type = ?`;
        countParams.push(type);
      }

      if (trainerId !== 'all') {
        countQuery += ` AND i.trainer_id = ?`;
        countParams.push(trainerId);
      }

      if (customerId !== 'all') {
        countQuery += ` AND i.customer_id = ?`;
        countParams.push(customerId);
      }

      if (dateFrom) {
        countQuery += ` AND i.invoice_date >= ?`;
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ` AND i.invoice_date <= ?`;
        countParams.push(dateTo);
      }

      if (search) {
        countQuery += ` AND i.invoice_number LIKE ?`;
        countParams.push(`%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalInvoices = countResult[0].total;

      // Process items field
      invoices.forEach(invoice => {
        if (invoice.items) {
          try {
            invoice.items = JSON.parse(invoice.items);
          } catch (e) {
            invoice.items = [];
          }
        }
      });

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalInvoices / limit),
            totalItems: totalInvoices,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoices',
        error: error.message
      });
    }
  },

  // ดึงข้อมูลใบแจ้งหนี้ตาม ID
  getInvoiceById: async (req, res) => {
    try {
      const { id } = req.params;

      const [invoices] = await db.execute(`
        SELECT i.*,
               c.first_name as customer_name,
               c.last_name as customer_lastname,
               c.email as customer_email,
               c.phone as customer_phone,
               c.address as customer_address,
               t.display_name as trainer_name,
               u.first_name as trainer_firstname,
               u.last_name as trainer_lastname,
               u.email as trainer_email,
               p.amount as payment_amount,
               p.status as payment_status,
               p.payment_method,
               p.transaction_id,
               p.paid_at
        FROM invoices i
        LEFT JOIN users c ON i.customer_id = c.id
        LEFT JOIN trainers t ON i.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN payments p ON i.payment_id = p.id
        WHERE i.id = ?
      `, [id]);

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      const invoice = invoices[0];

      // Parse items
      if (invoice.items) {
        try {
          invoice.items = JSON.parse(invoice.items);
        } catch (e) {
          invoice.items = [];
        }
      }

      // Get related transactions
      const [transactions] = await db.execute(`
        SELECT * FROM invoice_transactions
        WHERE invoice_id = ?
        ORDER BY created_at DESC
      `, [id]);

      res.json({
        success: true,
        data: {
          ...invoice,
          transactions
        }
      });

    } catch (error) {
      console.error('Get invoice by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoice details',
        error: error.message
      });
    }
  },

  // สร้างใบแจ้งหนี้ใหม่
  createInvoice: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        type,
        customer_id,
        trainer_id,
        booking_id,
        package_id,
        items,
        subtotal,
        discount_amount = 0,
        tax_amount = 0,
        total_amount,
        due_date,
        notes,
        payment_terms,
        send_email = true
      } = req.body;

      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const [lastInvoice] = await db.execute(
        'SELECT invoice_number FROM invoices WHERE YEAR(created_at) = ? ORDER BY id DESC LIMIT 1',
        [currentYear]
      );

      let invoiceNumber;
      if (lastInvoice.length > 0) {
        const lastNumber = parseInt(lastInvoice[0].invoice_number.split('-')[1]);
        invoiceNumber = `INV${currentYear}-${String(lastNumber + 1).padStart(6, '0')}`;
      } else {
        invoiceNumber = `INV${currentYear}-000001`;
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Insert invoice
        const [result] = await db.execute(`
          INSERT INTO invoices (
            invoice_number, type, customer_id, trainer_id,
            booking_id, package_id, items, subtotal,
            discount_amount, tax_amount, total_amount,
            invoice_date, due_date, status, notes,
            payment_terms, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'pending', ?, ?, NOW(), NOW())
        `, [
          invoiceNumber, type, customer_id, trainer_id,
          booking_id, package_id, JSON.stringify(items),
          subtotal, discount_amount, tax_amount, total_amount,
          due_date, notes, payment_terms
        ]);

        const invoiceId = result.insertId;

        // Record transaction
        await db.execute(`
          INSERT INTO invoice_transactions (
            invoice_id, action, description, user_id, created_at
          ) VALUES (?, 'created', 'Invoice created', ?, NOW())
        `, [invoiceId, req.user.id]);

        // Update booking if applicable
        if (booking_id) {
          await db.execute(
            'UPDATE bookings SET invoice_id = ? WHERE id = ?',
            [invoiceId, booking_id]
          );
        }

        await db.commit();

        // Send email if requested
        if (send_email) {
          await this.sendInvoiceEmail(invoiceId);
        }

        res.status(201).json({
          success: true,
          message: 'Invoice created successfully',
          data: {
            id: invoiceId,
            invoice_number: invoiceNumber
          }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create invoice',
        error: error.message
      });
    }
  },

  // อัพเดทใบแจ้งหนี้
  updateInvoice: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if invoice exists and is not paid
      const [invoices] = await db.execute(
        'SELECT * FROM invoices WHERE id = ? AND status != "paid"',
        [id]
      );

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found or already paid'
        });
      }

      const updateFields = [];
      const updateValues = [];

      // Dynamic update fields
      const allowedFields = [
        'items', 'subtotal', 'discount_amount', 'tax_amount',
        'total_amount', 'due_date', 'notes', 'payment_terms'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'items') {
            updateFields.push(`${field} = ?`);
            updateValues.push(JSON.stringify(req.body[field]));
          } else {
            updateFields.push(`${field} = ?`);
            updateValues.push(req.body[field]);
          }
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(id);

      // Start transaction
      await db.beginTransaction();

      try {
        await db.execute(
          `UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );

        // Record transaction
        await db.execute(`
          INSERT INTO invoice_transactions (
            invoice_id, action, description, user_id, created_at
          ) VALUES (?, 'updated', 'Invoice updated', ?, NOW())
        `, [id, req.user.id]);

        await db.commit();

        res.json({
          success: true,
          message: 'Invoice updated successfully'
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update invoice',
        error: error.message
      });
    }
  },

  // ยกเลิกใบแจ้งหนี้
  cancelInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Check if invoice exists and is not paid
      const [invoices] = await db.execute(
        'SELECT * FROM invoices WHERE id = ? AND status IN ("pending", "overdue")',
        [id]
      );

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found or cannot be cancelled'
        });
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Update invoice status
        await db.execute(
          'UPDATE invoices SET status = "cancelled", cancelled_at = NOW(), cancelled_reason = ? WHERE id = ?',
          [reason, id]
        );

        // Record transaction
        await db.execute(`
          INSERT INTO invoice_transactions (
            invoice_id, action, description, user_id, created_at
          ) VALUES (?, 'cancelled', ?, ?, NOW())
        `, [id, `Invoice cancelled: ${reason}`, req.user.id]);

        await db.commit();

        res.json({
          success: true,
          message: 'Invoice cancelled successfully'
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Cancel invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel invoice',
        error: error.message
      });
    }
  },

  // สร้าง PDF ใบแจ้งหนี้
  generateInvoicePDF: async (req, res) => {
    try {
      const { id } = req.params;

      // Get invoice details
      const [invoices] = await db.execute(`
        SELECT i.*,
               c.first_name as customer_name,
               c.last_name as customer_lastname,
               c.email as customer_email,
               c.phone as customer_phone,
               c.address as customer_address,
               t.display_name as trainer_name,
               u.first_name as trainer_firstname,
               u.last_name as trainer_lastname
        FROM invoices i
        LEFT JOIN users c ON i.customer_id = c.id
        LEFT JOIN trainers t ON i.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE i.id = ?
      `, [id]);

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      const invoice = invoices[0];

      // Parse items
      if (invoice.items) {
        try {
          invoice.items = JSON.parse(invoice.items);
        } catch (e) {
          invoice.items = [];
        }
      }

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });
      const filename = `invoice-${invoice.invoice_number}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);

      // Add logo and header
      doc.fontSize(20).text('INVOICE', 50, 50);
      doc.fontSize(10).text(`Invoice Number: ${invoice.invoice_number}`, 50, 80);
      doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('th-TH')}`, 50, 95);
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('th-TH')}`, 50, 110);

      // Customer details
      doc.fontSize(12).text('Bill To:', 50, 150);
      doc.fontSize(10).text(`${invoice.customer_name} ${invoice.customer_lastname}`, 50, 170);
      doc.text(invoice.customer_email, 50, 185);
      doc.text(invoice.customer_phone || '', 50, 200);
      doc.text(invoice.customer_address || '', 50, 215);

      // Trainer details
      if (invoice.trainer_name) {
        doc.fontSize(12).text('From:', 300, 150);
        doc.fontSize(10).text(invoice.trainer_name, 300, 170);
      }

      // Items table
      let yPosition = 280;
      doc.fontSize(12).text('Items', 50, yPosition);
      yPosition += 20;

      // Table header
      doc.fontSize(10);
      doc.text('Description', 50, yPosition);
      doc.text('Quantity', 300, yPosition);
      doc.text('Price', 380, yPosition);
      doc.text('Total', 460, yPosition);
      
      yPosition += 15;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      // Table rows
      invoice.items.forEach(item => {
        doc.text(item.description, 50, yPosition);
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`฿${item.price.toFixed(2)}`, 380, yPosition);
        doc.text(`฿${(item.quantity * item.price).toFixed(2)}`, 460, yPosition);
        yPosition += 20;
      });

      // Totals
      yPosition += 20;
      doc.moveTo(300, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      doc.text('Subtotal:', 380, yPosition);
      doc.text(`฿${invoice.subtotal.toFixed(2)}`, 460, yPosition);
      yPosition += 20;

      if (invoice.discount_amount > 0) {
        doc.text('Discount:', 380, yPosition);
        doc.text(`-฿${invoice.discount_amount.toFixed(2)}`, 460, yPosition);
        yPosition += 20;
      }

      if (invoice.tax_amount > 0) {
        doc.text('Tax (7%):', 380, yPosition);
        doc.text(`฿${invoice.tax_amount.toFixed(2)}`, 460, yPosition);
        yPosition += 20;
      }

      doc.fontSize(12);
      doc.text('Total:', 380, yPosition);
      doc.text(`฿${invoice.total_amount.toFixed(2)}`, 460, yPosition);

      // Notes
      if (invoice.notes) {
        yPosition += 40;
        doc.fontSize(10);
        doc.text('Notes:', 50, yPosition);
        doc.text(invoice.notes, 50, yPosition + 15);
      }

      // Payment terms
      if (invoice.payment_terms) {
        yPosition += 60;
        doc.text('Payment Terms:', 50, yPosition);
        doc.text(invoice.payment_terms, 50, yPosition + 15);
      }

      doc.end();

    } catch (error) {
      console.error('Generate invoice PDF error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice PDF',
        error: error.message
      });
    }
  },

  // ส่งใบแจ้งหนี้ทางอีเมล
  sendInvoiceEmail: async (invoiceId) => {
    try {
      // Get invoice details
      const [invoices] = await db.execute(`
        SELECT i.*, c.email as customer_email, c.first_name as customer_name
        FROM invoices i
        JOIN users c ON i.customer_id = c.id
        WHERE i.id = ?
      `, [invoiceId]);

      if (invoices.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoices[0];

      // Generate PDF in memory
      // (PDF generation code would go here)

      // Send email
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: invoice.customer_email,
        subject: `Invoice ${invoice.invoice_number}`,
        html: `
          <h2>Invoice ${invoice.invoice_number}</h2>
          <p>Dear ${invoice.customer_name},</p>
          <p>Please find attached your invoice for the amount of ฿${invoice.total_amount.toFixed(2)}.</p>
          <p>Due date: ${new Date(invoice.due_date).toLocaleDateString('th-TH')}</p>
          <p>Thank you for your business!</p>
        `,
        attachments: [
          {
            filename: `invoice-${invoice.invoice_number}.pdf`,
            content: 'PDF content here' // Would be actual PDF buffer
          }
        ]
      });

      // Record email sent
      await db.execute(`
        INSERT INTO invoice_transactions (
          invoice_id, action, description, created_at
        ) VALUES (?, 'email_sent', 'Invoice emailed to customer', NOW())
      `, [invoiceId]);

      return true;

    } catch (error) {
      console.error('Send invoice email error:', error);
      throw error;
    }
  },

  // บันทึกการชำระเงิน
  recordPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        payment_method,
        amount,
        transaction_id,
        payment_date,
        notes
      } = req.body;

      // Check invoice
      const [invoices] = await db.execute(
        'SELECT * FROM invoices WHERE id = ? AND status != "paid"',
        [id]
      );

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found or already paid'
        });
      }

      const invoice = invoices[0];

      if (amount < invoice.total_amount) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount is less than invoice total'
        });
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Create payment record
        const [paymentResult] = await db.execute(`
          INSERT INTO payments (
            invoice_id, customer_id, trainer_id, amount,
            payment_method, transaction_id, status, paid_at,
            notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, NOW())
        `, [
          id, invoice.customer_id, invoice.trainer_id,
          amount, payment_method, transaction_id,
          payment_date || new Date(), notes
        ]);

        const paymentId = paymentResult.insertId;

        // Update invoice
        await db.execute(
          'UPDATE invoices SET status = "paid", payment_id = ?, paid_at = ? WHERE id = ?',
          [paymentId, payment_date || new Date(), id]
        );

        // Record transaction
        await db.execute(`
          INSERT INTO invoice_transactions (
            invoice_id, action, description, user_id, created_at
          ) VALUES (?, 'paid', ?, ?, NOW())
        `, [id, `Payment received via ${payment_method}`, req.user.id]);

        // Update booking if applicable
        if (invoice.booking_id) {
          await db.execute(
            'UPDATE bookings SET payment_status = "paid" WHERE id = ?',
            [invoice.booking_id]
          );
        }

        await db.commit();

        res.json({
          success: true,
          message: 'Payment recorded successfully',
          data: {
            payment_id: paymentId
          }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record payment',
        error: error.message
      });
    }
  },

  // ดึงใบแจ้งหนี้ค้างชำระ
  getOverdueInvoices: async (req, res) => {
    try {
      const { days = 0 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const [invoices] = await db.execute(`
        SELECT i.*,
               c.first_name as customer_name,
               c.last_name as customer_lastname,
               c.email as customer_email,
               DATEDIFF(NOW(), i.due_date) as days_overdue
        FROM invoices i
        JOIN users c ON i.customer_id = c.id
        WHERE i.status = 'pending'
          AND i.due_date < NOW()
          AND i.due_date <= ?
        ORDER BY i.due_date ASC
      `, [cutoffDate]);

      // Update status to overdue
      if (invoices.length > 0) {
        const invoiceIds = invoices.map(inv => inv.id);
        const placeholders = invoiceIds.map(() => '?').join(',');
        
        await db.execute(
          `UPDATE invoices SET status = 'overdue' WHERE id IN (${placeholders}) AND status = 'pending'`,
          invoiceIds
        );
      }

      res.json({
        success: true,
        data: invoices
      });

    } catch (error) {
      console.error('Get overdue invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue invoices',
        error: error.message
      });
    }
  },

  // สรุปรายได้
  getRevenueReport: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'month',
        trainerId
      } = req.query;

      let dateFilter = '';
      const queryParams = [];

      if (startDate && endDate) {
        dateFilter = ' AND i.paid_at BETWEEN ? AND ?';
        queryParams.push(startDate, endDate);
      }

      if (trainerId) {
        dateFilter += ' AND i.trainer_id = ?';
        queryParams.push(trainerId);
      }

      // Revenue by period
      let groupByClause = '';
      switch (groupBy) {
        case 'day':
          groupByClause = "DATE_FORMAT(i.paid_at, '%Y-%m-%d')";
          break;
        case 'week':
          groupByClause = "DATE_FORMAT(i.paid_at, '%Y-%u')";
          break;
        case 'month':
          groupByClause = "DATE_FORMAT(i.paid_at, '%Y-%m')";
          break;
        case 'year':
          groupByClause = "DATE_FORMAT(i.paid_at, '%Y')";
          break;
      }

      const [revenueData] = await db.execute(`
        SELECT ${groupByClause} as period,
               COUNT(*) as invoice_count,
               SUM(i.total_amount) as total_revenue,
               SUM(i.discount_amount) as total_discount,
               SUM(i.tax_amount) as total_tax
        FROM invoices i
        WHERE i.status = 'paid' ${dateFilter}
        GROUP BY period
        ORDER BY period DESC
      `, queryParams);

      // Revenue by type
      const [revenueByType] = await db.execute(`
        SELECT i.type,
               COUNT(*) as count,
               SUM(i.total_amount) as total
        FROM invoices i
        WHERE i.status = 'paid' ${dateFilter}
        GROUP BY i.type
      `, queryParams);

      // Top customers
      const [topCustomers] = await db.execute(`
        SELECT c.id, c.first_name, c.last_name, c.email,
               COUNT(i.id) as invoice_count,
               SUM(i.total_amount) as total_spent
        FROM invoices i
        JOIN users c ON i.customer_id = c.id
        WHERE i.status = 'paid' ${dateFilter}
        GROUP BY c.id
        ORDER BY total_spent DESC
        LIMIT 10
      `, queryParams);

      res.json({
        success: true,
        data: {
          revenueByPeriod: revenueData,
          revenueByType,
          topCustomers
        }
      });

    } catch (error) {
      console.error('Get revenue report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate revenue report',
        error: error.message
      });
    }
  }
};

module.exports = invoiceController;
