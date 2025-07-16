// utils/analyticsUtils.js
const db = require('../config/database');
const moment = require('moment');

const analyticsUtils = {
  // Get revenue analytics
  getRevenueAnalytics: async (startDate, endDate, groupBy = 'day') => {
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const [revenue] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as transaction_count,
        SUM(amount) as total_revenue,
        AVG(amount) as average_transaction,
        MIN(amount) as min_transaction,
        MAX(amount) as max_transaction
      FROM payments
      WHERE status = 'completed'
        AND created_at BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC
    `, [dateFormat, startDate, endDate]);

    // Calculate growth rate
    if (revenue.length > 1) {
      for (let i = 1; i < revenue.length; i++) {
        const previousRevenue = revenue[i - 1].total_revenue;
        const currentRevenue = revenue[i].total_revenue;
        revenue[i].growth_rate = previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
          : 0;
      }
    }

    return revenue;
  },

  // Get user analytics
  getUserAnalytics: async (startDate, endDate) => {
    // New user registrations
    const [newUsers] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        role,
        COUNT(*) as count
      FROM users
      WHERE created_at BETWEEN ? AND ?
      GROUP BY date, role
      ORDER BY date ASC
    `, [startDate, endDate]);

    // Active users
    const [activeUsers] = await db.execute(`
      SELECT 
        DATE(last_login) as date,
        COUNT(DISTINCT id) as active_users
      FROM users
      WHERE last_login BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `, [startDate, endDate]);

    // User retention
    const [retention] = await db.execute(`
      SELECT 
        DATEDIFF(last_login, created_at) as days_retained,
        COUNT(*) as user_count
      FROM users
      WHERE created_at BETWEEN DATE_SUB(?, INTERVAL 30 DAY) AND ?
      GROUP BY days_retained
      ORDER BY days_retained ASC
    `, [endDate, endDate]);

    return {
      newUsers,
      activeUsers,
      retention
    };
  },

  // Get booking analytics
  getBookingAnalytics: async (startDate, endDate) => {
    // Bookings by status
    const [bookingsByStatus] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_value
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status
    `, [startDate, endDate]);

    // Bookings by time of day
    const [bookingsByHour] = await db.execute(`
      SELECT 
        HOUR(session_date) as hour,
        COUNT(*) as count
      FROM bookings
      WHERE session_date BETWEEN ? AND ?
      GROUP BY hour
      ORDER BY hour ASC
    `, [startDate, endDate]);

    // Popular time slots
    const [popularSlots] = await db.execute(`
      SELECT 
        TIME_FORMAT(session_time, '%H:%i') as time_slot,
        COUNT(*) as booking_count
      FROM bookings
      WHERE session_date BETWEEN ? AND ?
      GROUP BY time_slot
      ORDER BY booking_count DESC
      LIMIT 10
    `, [startDate, endDate]);

    // Cancellation rate
    const [cancellations] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(*) as total,
        ROUND(COUNT(CASE WHEN status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*), 2) as cancellation_rate
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `, [startDate, endDate]);

    return {
      byStatus: bookingsByStatus,
      byHour: bookingsByHour,
      popularSlots,
      cancellations
    };
  },

  // Get trainer performance
  getTrainerPerformance: async (trainerId, startDate, endDate) => {
    // Revenue
    const [revenue] = await db.execute(`
      SELECT 
        DATE(p.created_at) as date,
        SUM(p.amount) as revenue,
        COUNT(DISTINCT b.id) as sessions,
        COUNT(DISTINCT b.customer_id) as unique_clients
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE b.trainer_id = ?
        AND p.status = 'completed'
        AND p.created_at BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `, [trainerId, startDate, endDate]);

    // Client retention
    const [clientRetention] = await db.execute(`
      SELECT 
        customer_id,
        COUNT(*) as session_count,
        MIN(session_date) as first_session,
        MAX(session_date) as last_session,
        DATEDIFF(MAX(session_date), MIN(session_date)) as retention_days
      FROM bookings
      WHERE trainer_id = ?
        AND status = 'completed'
        AND session_date BETWEEN ? AND ?
      GROUP BY customer_id
      HAVING session_count > 1
    `, [trainerId, startDate, endDate]);

    // Average rating
    const [ratings] = await db.execute(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as review_count
      FROM reviews
      WHERE trainer_id = ?
        AND created_at BETWEEN ? AND ?
    `, [trainerId, startDate, endDate]);

    // Session completion rate
    const [sessionStats] = await db.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(*) as total
      FROM bookings
      WHERE trainer_id = ?
        AND session_date BETWEEN ? AND ?
    `, [trainerId, startDate, endDate]);

    const completionRate = sessionStats[0].total > 0
      ? (sessionStats[0].completed / sessionStats[0].total * 100).toFixed(2)
      : 0;

    return {
      revenue,
      clientRetention,
      averageRating: ratings[0].average_rating || 0,
      reviewCount: ratings[0].review_count || 0,
      sessionStats: {
        ...sessionStats[0],
        completionRate
      }
    };
  },

  // Get package analytics
  getPackageAnalytics: async (startDate, endDate) => {
    // Popular packages
    const [popularPackages] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.price,
        COUNT(pp.id) as purchase_count,
        SUM(pp.amount) as total_revenue
      FROM packages p
      JOIN package_purchases pp ON p.id = pp.package_id
      WHERE pp.created_at BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY purchase_count DESC
      LIMIT 10
    `, [startDate, endDate]);

    // Package usage
    const [packageUsage] = await db.execute(`
      SELECT 
        p.name,
        pp.sessions_total,
        pp.sessions_used,
        pp.sessions_remaining,
        ROUND(pp.sessions_used * 100.0 / pp.sessions_total, 2) as usage_rate
      FROM package_purchases pp
      JOIN packages p ON pp.package_id = p.id
      WHERE pp.purchase_date BETWEEN ? AND ?
        AND pp.status = 'active'
    `, [startDate, endDate]);

    return {
      popularPackages,
      packageUsage
    };
  },

  // Get conversion funnel
  getConversionFunnel: async (startDate, endDate) => {
    // Website visitors (from analytics table)
    const [visitors] = await db.execute(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM website_analytics
      WHERE created_at BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Registered users
    const [registrations] = await db.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at BETWEEN ? AND ?
        AND role = 'customer'
    `, [startDate, endDate]);

    // Users who viewed trainers
    const [trainerViews] = await db.execute(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM trainer_profile_views
      WHERE viewed_at BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Users who made bookings
    const [bookings] = await db.execute(`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Users who completed payments
    const [payments] = await db.execute(`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM payments
      WHERE created_at BETWEEN ? AND ?
        AND status = 'completed'
    `, [startDate, endDate]);

    const funnel = [
      { stage: 'Visitors', count: visitors[0]?.count || 0 },
      { stage: 'Registrations', count: registrations[0]?.count || 0 },
      { stage: 'Trainer Views', count: trainerViews[0]?.count || 0 },
      { stage: 'Bookings', count: bookings[0]?.count || 0 },
      { stage: 'Payments', count: payments[0]?.count || 0 }
    ];

    // Calculate conversion rates
    for (let i = 1; i < funnel.length; i++) {
      const previousCount = funnel[i - 1].count;
      const currentCount = funnel[i].count;
      funnel[i].conversionRate = previousCount > 0
        ? (currentCount / previousCount * 100).toFixed(2)
        : 0;
    }

    return funnel;
  },

  // Get demographic analytics
  getDemographicAnalytics: async () => {
    // Age distribution
    const [ageDistribution] = await db.execute(`
      SELECT 
        CASE
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 20 THEN 'Under 20'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 20 AND 29 THEN '20-29'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 30 AND 39 THEN '30-39'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 40 AND 49 THEN '40-49'
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 50 AND 59 THEN '50-59'
          ELSE '60+'
        END as age_group,
        COUNT(*) as count
      FROM users
      WHERE birth_date IS NOT NULL
        AND role = 'customer'
      GROUP BY age_group
      ORDER BY age_group
    `);

    // Gender distribution
    const [genderDistribution] = await db.execute(`
      SELECT 
        gender,
        COUNT(*) as count
      FROM users
      WHERE role = 'customer'
      GROUP BY gender
    `);

    // Location distribution
    const [locationDistribution] = await db.execute(`
      SELECT 
        province,
        COUNT(*) as count
      FROM users
      WHERE role = 'customer'
        AND province IS NOT NULL
      GROUP BY province
      ORDER BY count DESC
      LIMIT 10
    `);

    return {
      ageDistribution,
      genderDistribution,
      locationDistribution
    };
  },

  // Get real-time analytics
  getRealtimeAnalytics: async () => {
    const now = moment();
    const todayStart = now.clone().startOf('day');
    const yesterdayStart = now.clone().subtract(1, 'day').startOf('day');
    const yesterdayEnd = now.clone().subtract(1, 'day').endOf('day');

    // Today's metrics
    const [todayMetrics] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) as new_users,
        (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURDATE()) as new_bookings,
        (SELECT SUM(amount) FROM payments WHERE DATE(created_at) = CURDATE() AND status = 'completed') as revenue,
        (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE DATE(created_at) = CURDATE()) as active_users
    `);

    // Yesterday's metrics for comparison
    const [yesterdayMetrics] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as new_users,
        (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as new_bookings,
        (SELECT SUM(amount) FROM payments WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status = 'completed') as revenue,
        (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as active_users
    `);

    // Calculate changes
    const calculateChange = (today, yesterday) => {
      if (!yesterday || yesterday === 0) return 0;
      return ((today - yesterday) / yesterday * 100).toFixed(2);
    };

    return {
      today: todayMetrics[0],
      yesterday: yesterdayMetrics[0],
      changes: {
        newUsers: calculateChange(todayMetrics[0].new_users, yesterdayMetrics[0].new_users),
        newBookings: calculateChange(todayMetrics[0].new_bookings, yesterdayMetrics[0].new_bookings),
        revenue: calculateChange(todayMetrics[0].revenue || 0, yesterdayMetrics[0].revenue || 0),
        activeUsers: calculateChange(todayMetrics[0].active_users, yesterdayMetrics[0].active_users)
      }
    };
  },

  // Track event
  trackEvent: async (eventData) => {
    const {
      userId,
      eventType,
      eventCategory,
      eventAction,
      eventLabel,
      eventValue,
      metadata = {}
    } = eventData;

    try {
      await db.execute(`
        INSERT INTO analytics_events (
          user_id, event_type, event_category,
          event_action, event_label, event_value,
          metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        userId,
        eventType,
        eventCategory,
        eventAction,
        eventLabel,
        eventValue,
        JSON.stringify(metadata)
      ]);

      return true;
    } catch (error) {
      console.error('Track event error:', error);
      return false;
    }
  },

  // Get custom report
  getCustomReport: async (config) => {
    const {
      metrics = [],
      dimensions = [],
      filters = {},
      startDate,
      endDate,
      limit = 100
    } = config;

    // Build dynamic query based on configuration
    let selectClauses = [];
    let groupByClauses = [];
    let whereClauses = ['1=1'];
    let joins = [];

    // Add metrics
    metrics.forEach(metric => {
      switch (metric) {
        case 'revenue':
          selectClauses.push('SUM(p.amount) as revenue');
          joins.push('LEFT JOIN payments p ON b.id = p.booking_id');
          break;
        case 'bookings':
          selectClauses.push('COUNT(DISTINCT b.id) as bookings');
          break;
        case 'users':
          selectClauses.push('COUNT(DISTINCT u.id) as users');
          break;
        // Add more metrics as needed
      }
    });

    // Add dimensions
    dimensions.forEach(dimension => {
      switch (dimension) {
        case 'date':
          selectClauses.push('DATE(b.created_at) as date');
          groupByClauses.push('date');
          break;
        case 'trainer':
          selectClauses.push('t.id as trainer_id, t.display_name as trainer_name');
          groupByClauses.push('t.id');
          joins.push('LEFT JOIN trainers t ON b.trainer_id = t.id');
          break;
        // Add more dimensions as needed
      }
    });

    // Add filters
    if (filters.trainerId) {
      whereClauses.push('b.trainer_id = ?');
    }

    if (startDate && endDate) {
      whereClauses.push('b.created_at BETWEEN ? AND ?');
    }

    // Build final query
    const query = `
      SELECT ${selectClauses.join(', ')}
      FROM bookings b
      ${joins.join(' ')}
      WHERE ${whereClauses.join(' AND ')}
      ${groupByClauses.length > 0 ? 'GROUP BY ' + groupByClauses.join(', ') : ''}
      ORDER BY ${selectClauses[0]} DESC
      LIMIT ${limit}
    `;

    // Execute query with parameters
    const params = [];
    if (filters.trainerId) params.push(filters.trainerId);
    if (startDate && endDate) params.push(startDate, endDate);

    const [results] = await db.execute(query, params);

    return results;
  },

  // Export analytics data
  exportAnalyticsData: async (type, startDate, endDate, format = 'csv') => {
    let data;

    switch (type) {
      case 'revenue':
        data = await analyticsUtils.getRevenueAnalytics(startDate, endDate);
        break;
      case 'users':
        data = await analyticsUtils.getUserAnalytics(startDate, endDate);
        break;
      case 'bookings':
        data = await analyticsUtils.getBookingAnalytics(startDate, endDate);
        break;
      default:
        throw new Error('Invalid analytics type');
    }

    if (format === 'csv') {
      return analyticsUtils.convertToCSV(data);
    } else if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    return data;
  },

  // Convert data to CSV
  convertToCSV: (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    return csv;
  },

  // Calculate trends
  calculateTrends: (data, metricKey) => {
    if (!Array.isArray(data) || data.length < 2) {
      return null;
    }

    const values = data.map(item => item[metricKey] || 0);
    const n = values.length;

    // Calculate linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    let ssTotal = 0, ssResidual = 0;

    for (let i = 0; i < n; i++) {
      const yPredicted = slope * i + intercept;
      ssTotal += Math.pow(values[i] - yMean, 2);
      ssResidual += Math.pow(values[i] - yPredicted, 2);
    }

    const rSquared = 1 - (ssResidual / ssTotal);

    return {
      slope,
      intercept,
      rSquared,
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      strength: Math.abs(rSquared) > 0.7 ? 'strong' : Math.abs(rSquared) > 0.3 ? 'moderate' : 'weak'
    };
  }
};

module.exports = analyticsUtils;
