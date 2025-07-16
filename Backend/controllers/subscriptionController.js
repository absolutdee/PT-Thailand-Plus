// subscriptionController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const cron = require('node-cron');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const subscriptionController = {
  // ดึงรายการ Subscription Plans ทั้งหมด
  getAllSubscriptionPlans: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type = 'all',
        status = 'all',
        search = '',
        sortBy = 'created_at',
        order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT sp.*,
               COUNT(DISTINCT s.id) as active_subscribers
        FROM subscription_plans sp
        LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
        WHERE 1=1
      `;

      const queryParams = [];

      // Type filter (trainer, gym, platform)
      if (type !== 'all') {
        query += ` AND sp.type = ?`;
        queryParams.push(type);
      }

      // Status filter
      if (status !== 'all') {
        query += ` AND sp.status = ?`;
        queryParams.push(status);
      }

      // Search filter
      if (search) {
        query += ` AND (sp.name LIKE ? OR sp.description LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Group by
      query += ` GROUP BY sp.id`;

      // Sorting
      const allowedSortFields = ['created_at', 'name', 'price', 'billing_cycle'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      query += ` ORDER BY sp.${sortField} ${order === 'ASC' ? 'ASC' : 'DESC'}`;

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [plans] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM subscription_plans sp WHERE 1=1`;
      const countParams = [];

      if (type !== 'all') {
        countQuery += ` AND sp.type = ?`;
        countParams.push(type);
      }

      if (status !== 'all') {
        countQuery += ` AND sp.status = ?`;
        countParams.push(status);
      }

      if (search) {
        countQuery += ` AND (sp.name LIKE ? OR sp.description LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalPlans = countResult[0].total;

      // Process features field
      plans.forEach(plan => {
        if (plan.features) {
          try {
            plan.features = JSON.parse(plan.features);
          } catch (e) {
            plan.features = [];
          }
        }
      });

      res.json({
        success: true,
        data: {
          plans,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalPlans / limit),
            totalItems: totalPlans,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all subscription plans error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription plans',
        error: error.message
      });
    }
  },

  // สร้าง Subscription Plan ใหม่
  createSubscriptionPlan: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        type,
        billing_cycle,
        price,
        currency = 'THB',
        features,
        trial_days = 0,
        setup_fee = 0,
        max_users = 1,
        stripe_plan_id,
        status = 'active'
      } = req.body;

      // Create plan in Stripe if enabled
      let stripePlanId = stripe_plan_id;
      if (process.env.STRIPE_ENABLED === 'true' && !stripePlanId) {
        try {
          const stripePlan = await stripe.products.create({
            name: name,
            description: description,
            metadata: {
              type: type,
              billing_cycle: billing_cycle
            }
          });

          const stripePrice = await stripe.prices.create({
            product: stripePlan.id,
            unit_amount: price * 100, // Convert to cents
            currency: currency.toLowerCase(),
            recurring: {
              interval: billing_cycle === 'monthly' ? 'month' : 'year'
            }
          });

          stripePlanId = stripePrice.id;
        } catch (stripeError) {
          console.error('Stripe error:', stripeError);
        }
      }

      // Insert plan
      const [result] = await db.execute(`
        INSERT INTO subscription_plans (
          name, description, type, billing_cycle, price,
          currency, features, trial_days, setup_fee,
          max_users, stripe_plan_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        name, description, type, billing_cycle, price,
        currency, JSON.stringify(features || []), trial_days,
        setup_fee, max_users, stripePlanId, status
      ]);

      res.status(201).json({
        success: true,
        message: 'Subscription plan created successfully',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('Create subscription plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription plan',
        error: error.message
      });
    }
  },

  // สร้าง Subscription สำหรับผู้ใช้
  createSubscription: async (req, res) => {
    try {
      const {
        plan_id,
        customer_id,
        payment_method,
        auto_renew = true,
        coupon_code
      } = req.body;

      const subscriberId = req.user.id;

      // Check if plan exists
      const [plans] = await db.execute(
        'SELECT * FROM subscription_plans WHERE id = ? AND status = "active"',
        [plan_id]
      );

      if (plans.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      const plan = plans[0];

      // Check for existing active subscription
      const [existingSubs] = await db.execute(
        'SELECT * FROM subscriptions WHERE subscriber_id = ? AND status = "active"',
        [subscriberId]
      );

      if (existingSubs.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active subscription'
        });
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan.trial_days > 0) {
        startDate.setDate(startDate.getDate() + plan.trial_days);
      }

      if (plan.billing_cycle === 'monthly') {
        endDate.setMonth(startDate.getMonth() + 1);
      } else if (plan.billing_cycle === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);
      }

      // Calculate price with discount if coupon applied
      let finalPrice = plan.price + plan.setup_fee;
      let discountAmount = 0;
      let couponId = null;

      if (coupon_code) {
        const [coupons] = await db.execute(
          'SELECT * FROM coupons WHERE code = ? AND status = "active"',
          [coupon_code]
        );

        if (coupons.length > 0) {
          const coupon = coupons[0];
          couponId = coupon.id;

          if (coupon.discount_type === 'percentage') {
            discountAmount = (finalPrice * coupon.discount_value) / 100;
          } else {
            discountAmount = coupon.discount_value;
          }

          finalPrice -= discountAmount;
        }
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Create subscription
        const [subResult] = await db.execute(`
          INSERT INTO subscriptions (
            subscriber_id, plan_id, customer_id,
            start_date, end_date, trial_end_date,
            status, auto_renew, next_billing_date,
            amount, discount_amount, coupon_id,
            payment_method, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          subscriberId, plan_id, customer_id,
          plan.trial_days > 0 ? new Date() : startDate,
          endDate,
          plan.trial_days > 0 ? startDate : null,
          plan.trial_days > 0 ? 'trial' : 'active',
          auto_renew,
          startDate,
          finalPrice,
          discountAmount,
          couponId,
          payment_method
        ]);

        const subscriptionId = subResult.insertId;

        // Create initial payment if not in trial
        if (plan.trial_days === 0) {
          const [paymentResult] = await db.execute(`
            INSERT INTO subscription_payments (
              subscription_id, amount, payment_method,
              status, payment_date, created_at
            ) VALUES (?, ?, ?, 'pending', NOW(), NOW())
          `, [subscriptionId, finalPrice, payment_method]);

          // Process payment
          // (Payment processing logic would go here)
        }

        // Record transaction
        await db.execute(`
          INSERT INTO subscription_transactions (
            subscription_id, action, description,
            user_id, created_at
          ) VALUES (?, 'created', 'Subscription created', ?, NOW())
        `, [subscriptionId, subscriberId]);

        await db.commit();

        res.status(201).json({
          success: true,
          message: 'Subscription created successfully',
          data: {
            subscription_id: subscriptionId,
            trial_days: plan.trial_days,
            next_billing_date: startDate
          }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
        error: error.message
      });
    }
  },

  // ดึงข้อมูล Subscription ของผู้ใช้
  getUserSubscriptions: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status = 'all' } = req.query;

      let query = `
        SELECT s.*,
               sp.name as plan_name,
               sp.description as plan_description,
               sp.features as plan_features,
               sp.billing_cycle,
               COUNT(sp2.id) as payment_count
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        LEFT JOIN subscription_payments sp2 ON s.id = sp2.subscription_id
        WHERE s.subscriber_id = ?
      `;

      const queryParams = [userId];

      if (status !== 'all') {
        query += ` AND s.status = ?`;
        queryParams.push(status);
      }

      query += ` GROUP BY s.id ORDER BY s.created_at DESC`;

      const [subscriptions] = await db.execute(query, queryParams);

      // Process features
      subscriptions.forEach(sub => {
        if (sub.plan_features) {
          try {
            sub.plan_features = JSON.parse(sub.plan_features);
          } catch (e) {
            sub.plan_features = [];
          }
        }
      });

      res.json({
        success: true,
        data: subscriptions
      });

    } catch (error) {
      console.error('Get user subscriptions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscriptions',
        error: error.message
      });
    }
  },

  // ยกเลิก Subscription
  cancelSubscription: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, immediate = false } = req.body;
      const userId = req.user.id;

      // Check subscription ownership
      const [subscriptions] = await db.execute(
        'SELECT * FROM subscriptions WHERE id = ? AND subscriber_id = ? AND status IN ("active", "trial")',
        [id, userId]
      );

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found or already cancelled'
        });
      }

      const subscription = subscriptions[0];

      // Start transaction
      await db.beginTransaction();

      try {
        if (immediate) {
          // Cancel immediately
          await db.execute(
            'UPDATE subscriptions SET status = "cancelled", cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?',
            [reason, id]
          );
        } else {
          // Cancel at end of billing period
          await db.execute(
            'UPDATE subscriptions SET auto_renew = 0, pending_cancellation = 1, cancellation_reason = ? WHERE id = ?',
            [reason, id]
          );
        }

        // Record transaction
        await db.execute(`
          INSERT INTO subscription_transactions (
            subscription_id, action, description, user_id, created_at
          ) VALUES (?, 'cancelled', ?, ?, NOW())
        `, [id, `Subscription cancelled: ${reason}`, userId]);

        // Cancel in Stripe if applicable
        if (subscription.stripe_subscription_id && process.env.STRIPE_ENABLED === 'true') {
          try {
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
              cancel_at_period_end: !immediate
            });
          } catch (stripeError) {
            console.error('Stripe cancellation error:', stripeError);
          }
        }

        await db.commit();

        res.json({
          success: true,
          message: immediate ? 'Subscription cancelled immediately' : 'Subscription will be cancelled at end of billing period'
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error.message
      });
    }
  },

  // เปลี่ยนแปลง Subscription Plan
  changeSubscriptionPlan: async (req, res) => {
    try {
      const { id } = req.params;
      const { new_plan_id, change_immediately = false } = req.body;
      const userId = req.user.id;

      // Check subscription ownership
      const [subscriptions] = await db.execute(
        'SELECT * FROM subscriptions WHERE id = ? AND subscriber_id = ? AND status = "active"',
        [id, userId]
      );

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Active subscription not found'
        });
      }

      const currentSubscription = subscriptions[0];

      // Check new plan
      const [newPlans] = await db.execute(
        'SELECT * FROM subscription_plans WHERE id = ? AND status = "active"',
        [new_plan_id]
      );

      if (newPlans.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'New subscription plan not found'
        });
      }

      const newPlan = newPlans[0];

      // Calculate proration if changing immediately
      let proratedAmount = 0;
      if (change_immediately) {
        const daysRemaining = Math.ceil(
          (new Date(currentSubscription.end_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        const totalDays = currentSubscription.billing_cycle === 'monthly' ? 30 : 365;
        const dailyRate = currentSubscription.amount / totalDays;
        const creditAmount = dailyRate * daysRemaining;

        proratedAmount = newPlan.price - creditAmount;
      }

      // Start transaction
      await db.beginTransaction();

      try {
        if (change_immediately) {
          // Update subscription immediately
          await db.execute(`
            UPDATE subscriptions 
            SET plan_id = ?, amount = ?, updated_at = NOW()
            WHERE id = ?
          `, [new_plan_id, newPlan.price, id]);

          // Create proration payment if needed
          if (proratedAmount > 0) {
            await db.execute(`
              INSERT INTO subscription_payments (
                subscription_id, amount, payment_method,
                status, description, payment_date, created_at
              ) VALUES (?, ?, ?, 'pending', 'Plan change proration', NOW(), NOW())
            `, [id, proratedAmount, currentSubscription.payment_method]);
          }
        } else {
          // Schedule plan change for next billing cycle
          await db.execute(`
            UPDATE subscriptions 
            SET pending_plan_id = ?, updated_at = NOW()
            WHERE id = ?
          `, [new_plan_id, id]);
        }

        // Record transaction
        await db.execute(`
          INSERT INTO subscription_transactions (
            subscription_id, action, description, user_id, created_at
          ) VALUES (?, 'plan_changed', ?, ?, NOW())
        `, [id, `Plan changed to ${newPlan.name}`, userId]);

        await db.commit();

        res.json({
          success: true,
          message: change_immediately ? 'Plan changed successfully' : 'Plan change scheduled for next billing cycle',
          data: {
            new_plan: newPlan.name,
            proration_amount: proratedAmount
          }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Change subscription plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change subscription plan',
        error: error.message
      });
    }
  },

  // ต่ออายุ Subscription
  renewSubscription: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check subscription
      const [subscriptions] = await db.execute(
        'SELECT s.*, sp.* FROM subscriptions s JOIN subscription_plans sp ON s.plan_id = sp.id WHERE s.id = ? AND s.subscriber_id = ?',
        [id, userId]
      );

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      const subscription = subscriptions[0];

      // Calculate new dates
      const newStartDate = new Date(subscription.end_date);
      const newEndDate = new Date(newStartDate);

      if (subscription.billing_cycle === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (subscription.billing_cycle === 'yearly') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Update subscription
        await db.execute(`
          UPDATE subscriptions 
          SET start_date = ?, end_date = ?, 
              next_billing_date = ?, status = 'active',
              updated_at = NOW()
          WHERE id = ?
        `, [newStartDate, newEndDate, newEndDate, id]);

        // Create payment record
        const [paymentResult] = await db.execute(`
          INSERT INTO subscription_payments (
            subscription_id, amount, payment_method,
            status, payment_date, created_at
          ) VALUES (?, ?, ?, 'pending', NOW(), NOW())
        `, [id, subscription.amount, subscription.payment_method]);

        // Process payment
        // (Payment processing logic would go here)

        // Record transaction
        await db.execute(`
          INSERT INTO subscription_transactions (
            subscription_id, action, description, user_id, created_at
          ) VALUES (?, 'renewed', 'Subscription renewed', ?, NOW())
        `, [id, userId]);

        await db.commit();

        res.json({
          success: true,
          message: 'Subscription renewed successfully',
          data: {
            new_end_date: newEndDate,
            payment_id: paymentResult.insertId
          }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Renew subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to renew subscription',
        error: error.message
      });
    }
  },

  // ประวัติการชำระเงิน Subscription
  getSubscriptionPaymentHistory: async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const [subscriptions] = await db.execute(
        'SELECT * FROM subscriptions WHERE id = ? AND subscriber_id = ?',
        [subscriptionId, userId]
      );

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      // Get payment history
      const [payments] = await db.execute(`
        SELECT * FROM subscription_payments
        WHERE subscription_id = ?
        ORDER BY payment_date DESC
      `, [subscriptionId]);

      res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      console.error('Get subscription payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error.message
      });
    }
  },

  // Cron job สำหรับ auto-renewal
  processAutoRenewals: async () => {
    try {
      // Find subscriptions due for renewal
      const [subscriptions] = await db.execute(`
        SELECT s.*, sp.price, sp.billing_cycle
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.status = 'active'
          AND s.auto_renew = 1
          AND s.next_billing_date <= NOW()
          AND s.pending_cancellation = 0
      `);

      for (const subscription of subscriptions) {
        try {
          // Calculate new dates
          const newStartDate = new Date();
          const newEndDate = new Date();

          if (subscription.billing_cycle === 'monthly') {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
          } else if (subscription.billing_cycle === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          }

          // Start transaction
          await db.beginTransaction();

          try {
            // Create payment
            const [paymentResult] = await db.execute(`
              INSERT INTO subscription_payments (
                subscription_id, amount, payment_method,
                status, payment_date, created_at
              ) VALUES (?, ?, ?, 'pending', NOW(), NOW())
            `, [subscription.id, subscription.price, subscription.payment_method]);

            // Process payment
            // (Payment processing logic)
            const paymentSuccess = true; // Simulate payment

            if (paymentSuccess) {
              // Update subscription
              await db.execute(`
                UPDATE subscriptions 
                SET start_date = ?, end_date = ?, 
                    next_billing_date = ?, updated_at = NOW()
                WHERE id = ?
              `, [newStartDate, newEndDate, newEndDate, subscription.id]);

              // Update payment status
              await db.execute(
                'UPDATE subscription_payments SET status = "completed" WHERE id = ?',
                [paymentResult.insertId]
              );

              // Record transaction
              await db.execute(`
                INSERT INTO subscription_transactions (
                  subscription_id, action, description, created_at
                ) VALUES (?, 'auto_renewed', 'Subscription auto-renewed', NOW())
              `, [subscription.id]);

              await db.commit();
            } else {
              await db.rollback();

              // Mark subscription as payment failed
              await db.execute(
                'UPDATE subscriptions SET status = "payment_failed" WHERE id = ?',
                [subscription.id]
              );
            }

          } catch (error) {
            await db.rollback();
            throw error;
          }

        } catch (error) {
          console.error(`Failed to renew subscription ${subscription.id}:`, error);
        }
      }

      // Process trial expirations
      const [trialSubs] = await db.execute(`
        SELECT * FROM subscriptions
        WHERE status = 'trial'
          AND trial_end_date <= NOW()
      `);

      for (const trialSub of trialSubs) {
        await db.execute(
          'UPDATE subscriptions SET status = "active" WHERE id = ?',
          [trialSub.id]
        );
      }

      console.log(`Processed ${subscriptions.length} renewals and ${trialSubs.length} trial expirations`);

    } catch (error) {
      console.error('Process auto renewals error:', error);
    }
  },

  // สถิติ Subscription
  getSubscriptionStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      const queryParams = [];

      if (startDate && endDate) {
        dateFilter = ' AND s.created_at BETWEEN ? AND ?';
        queryParams.push(startDate, endDate);
      }

      // Active subscriptions by plan
      const [activeByPlan] = await db.execute(`
        SELECT sp.name, sp.type, COUNT(s.id) as count,
               SUM(s.amount) as total_revenue
        FROM subscription_plans sp
        LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
        GROUP BY sp.id
      `);

      // Subscription trends
      const [monthlyTrends] = await db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
               COUNT(*) as new_subscriptions,
               SUM(amount) as revenue
        FROM subscriptions
        WHERE 1=1 ${dateFilter}
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `, queryParams);

      // Churn rate
      const [churnData] = await db.execute(`
        SELECT 
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(*) as total
        FROM subscriptions
        WHERE 1=1 ${dateFilter}
      `, queryParams);

      const churnRate = churnData[0].total > 0 
        ? (churnData[0].cancelled / churnData[0].total * 100).toFixed(2)
        : 0;

      // Revenue by billing cycle
      const [revenueByCycle] = await db.execute(`
        SELECT sp.billing_cycle,
               COUNT(s.id) as count,
               SUM(s.amount) as total_revenue
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.status = 'active'
        GROUP BY sp.billing_cycle
      `);

      res.json({
        success: true,
        data: {
          activeByPlan,
          monthlyTrends,
          churnRate: `${churnRate}%`,
          revenueByCycle,
          summary: churnData[0]
        }
      });

    } catch (error) {
      console.error('Get subscription statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription statistics',
        error: error.message
      });
    }
  }
};

// Schedule cron job for auto-renewals (run daily at 2 AM)
cron.schedule('0 2 * * *', () => {
  console.log('Running subscription auto-renewal process...');
  subscriptionController.processAutoRenewals();
});

module.exports = subscriptionController;
