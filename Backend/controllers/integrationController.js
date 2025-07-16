// controllers/integrationController.js
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const Progress = require('../models/Progress');
const WorkoutPlan = require('../models/WorkoutPlan');
const NutritionPlan = require('../models/NutritionPlan');

class IntegrationController {
  // ==================== FITNESS TRACKER INTEGRATIONS ====================

  // Connect Fitbit
  async connectFitbit(req, res) {
    try {
      const userId = req.user.userId;
      const { code } = req.body;

      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://api.fitbit.com/oauth2/token',
        {
          code,
          grant_type: 'authorization_code',
          client_id: process.env.FITBIT_CLIENT_ID,
          redirect_uri: process.env.FITBIT_REDIRECT_URI
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token, user_id } = tokenResponse.data;

      // Save tokens
      await User.findByIdAndUpdate(userId, {
        'integrations.fitbit': {
          connected: true,
          userId: user_id,
          accessToken: access_token,
          refreshToken: refresh_token,
          connectedAt: new Date()
        }
      });

      // Initial data sync
      await this.syncFitbitData(userId);

      res.json({
        success: true,
        message: 'เชื่อมต่อ Fitbit สำเร็จ'
      });

    } catch (error) {
      console.error('Connect Fitbit error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Fitbit'
      });
    }
  }

  // Sync Fitbit data
  async syncFitbitData(userId) {
    try {
      const user = await User.findById(userId);
      const fitbitData = user.integrations?.fitbit;

      if (!fitbitData || !fitbitData.connected) {
        throw new Error('Fitbit not connected');
      }

      const today = new Date().toISOString().split('T')[0];

      // Get daily activity summary
      const activityResponse = await axios.get(
        `https://api.fitbit.com/1/user/${fitbitData.userId}/activities/date/${today}.json`,
        {
          headers: {
            'Authorization': `Bearer ${fitbitData.accessToken}`
          }
        }
      );

      const { summary } = activityResponse.data;

      // Get body measurements
      const bodyResponse = await axios.get(
        `https://api.fitbit.com/1/user/${fitbitData.userId}/body/log/weight/date/${today}.json`,
        {
          headers: {
            'Authorization': `Bearer ${fitbitData.accessToken}`
          }
        }
      );

      // Save to progress
      const progressData = {
        clientId: user.clientProfile,
        weight: bodyResponse.data.weight?.[0]?.weight,
        steps: summary.steps,
        caloriesOut: summary.caloriesOut,
        activeMinutes: summary.veryActiveMinutes + summary.fairlyActiveMinutes,
        distance: summary.distances?.find(d => d.activity === 'total')?.distance,
        heartRate: summary.restingHeartRate,
        sleepHours: null, // Will get from sleep endpoint
        source: 'fitbit',
        recordedAt: new Date()
      };

      // Get sleep data
      const sleepResponse = await axios.get(
        `https://api.fitbit.com/1.2/user/${fitbitData.userId}/sleep/date/${today}.json`,
        {
          headers: {
            'Authorization': `Bearer ${fitbitData.accessToken}`
          }
        }
      );

      if (sleepResponse.data.summary) {
        progressData.sleepHours = sleepResponse.data.summary.totalMinutesAsleep / 60;
      }

      await Progress.create(progressData);

      return progressData;

    } catch (error) {
      console.error('Sync Fitbit data error:', error);
      throw error;
    }
  }

  // Connect Apple Health (via HealthKit)
  async connectAppleHealth(req, res) {
    try {
      const userId = req.user.userId;
      const { healthData } = req.body;

      // Process health data from iOS app
      const progressData = {
        clientId: req.user.clientId,
        weight: healthData.weight,
        steps: healthData.steps,
        caloriesOut: healthData.activeCalories,
        heartRate: healthData.heartRate,
        sleepHours: healthData.sleepHours,
        source: 'apple_health',
        recordedAt: new Date(healthData.date)
      };

      await Progress.create(progressData);

      // Update integration status
      await User.findByIdAndUpdate(userId, {
        'integrations.appleHealth': {
          connected: true,
          lastSyncAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'ซิงค์ข้อมูล Apple Health สำเร็จ'
      });

    } catch (error) {
      console.error('Connect Apple Health error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล Apple Health'
      });
    }
  }

  // Connect Garmin
  async connectGarmin(req, res) {
    try {
      const userId = req.user.userId;
      const { oauthToken, oauthTokenSecret } = req.body;

      // Save Garmin credentials
      await User.findByIdAndUpdate(userId, {
        'integrations.garmin': {
          connected: true,
          oauthToken,
          oauthTokenSecret,
          connectedAt: new Date()
        }
      });

      // Initial sync
      await this.syncGarminData(userId);

      res.json({
        success: true,
        message: 'เชื่อมต่อ Garmin สำเร็จ'
      });

    } catch (error) {
      console.error('Connect Garmin error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Garmin'
      });
    }
  }

  // ==================== NUTRITION APP INTEGRATIONS ====================

  // Connect MyFitnessPal
  async connectMyFitnessPal(req, res) {
    try {
      const userId = req.user.userId;
      const { username, password } = req.body;

      // Note: MyFitnessPal doesn't have official API
      // This is a placeholder for web scraping implementation
      
      // Encrypt credentials
      const encryptedPassword = this.encryptData(password);

      await User.findByIdAndUpdate(userId, {
        'integrations.myfitnesspal': {
          connected: true,
          username,
          encryptedPassword,
          connectedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'เชื่อมต่อ MyFitnessPal สำเร็จ'
      });

    } catch (error) {
      console.error('Connect MyFitnessPal error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ MyFitnessPal'
      });
    }
  }

  // Sync nutrition data
  async syncNutritionData(req, res) {
    try {
      const userId = req.user.userId;
      const clientId = req.user.clientId;
      const { source, date } = req.body;

      let nutritionData;

      switch (source) {
        case 'myfitnesspal':
          nutritionData = await this.syncMyFitnessPalData(userId, date);
          break;
        case 'cronometer':
          nutritionData = await this.syncCronometerData(userId, date);
          break;
        default:
          throw new Error('Unsupported nutrition source');
      }

      // Find active nutrition plan
      const nutritionPlan = await NutritionPlan.findOne({
        clientId,
        isActive: true
      });

      if (nutritionPlan) {
        // Add to daily logs
        const existingLog = nutritionPlan.dailyLogs.find(
          log => log.date.toDateString() === new Date(date).toDateString()
        );

        if (existingLog) {
          // Update existing log
          Object.assign(existingLog, nutritionData);
        } else {
          // Create new log
          nutritionPlan.dailyLogs.push({
            date: new Date(date),
            ...nutritionData,
            source
          });
        }

        await nutritionPlan.save();
      }

      res.json({
        success: true,
        message: 'ซิงค์ข้อมูลโภชนาการสำเร็จ',
        data: nutritionData
      });

    } catch (error) {
      console.error('Sync nutrition data error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลโภชนาการ'
      });
    }
  }

  // ==================== PAYMENT INTEGRATIONS ====================

  // Connect Stripe
  async connectStripe(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { code } = req.body;

      // Exchange code for Stripe account ID
      const response = await axios.post(
        'https://connect.stripe.com/oauth/token',
        {
          grant_type: 'authorization_code',
          code,
          client_secret: process.env.STRIPE_SECRET_KEY
        }
      );

      const { stripe_user_id } = response.data;

      // Save Stripe account ID
      await Trainer.findByIdAndUpdate(trainerId, {
        'paymentIntegrations.stripe': {
          connected: true,
          accountId: stripe_user_id,
          connectedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'เชื่อมต่อ Stripe สำเร็จ'
      });

    } catch (error) {
      console.error('Connect Stripe error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Stripe'
      });
    }
  }

  // Connect PayPal
  async connectPayPal(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { merchantId, email } = req.body;

      await Trainer.findByIdAndUpdate(trainerId, {
        'paymentIntegrations.paypal': {
          connected: true,
          merchantId,
          email,
          connectedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'เชื่อมต่อ PayPal สำเร็จ'
      });

    } catch (error) {
      console.error('Connect PayPal error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ PayPal'
      });
    }
  }

  // ==================== COMMUNICATION INTEGRATIONS ====================

  // Connect Zoom
  async connectZoom(req, res) {
    try {
      const userId = req.user.userId;
      const { code } = req.body;

      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.ZOOM_REDIRECT_URI
          },
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
            ).toString('base64')}`
          }
        }
      );

      const { access_token, refresh_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get(
        'https://api.zoom.us/v2/users/me',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );

      await User.findByIdAndUpdate(userId, {
        'integrations.zoom': {
          connected: true,
          userId: userResponse.data.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          connectedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'เชื่อมต่อ Zoom สำเร็จ'
      });

    } catch (error) {
      console.error('Connect Zoom error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Zoom'
      });
    }
  }

  // Create Zoom meeting
  async createZoomMeeting(req, res) {
    try {
      const userId = req.user.userId;
      const { topic, startTime, duration, bookingId } = req.body;

      const user = await User.findById(userId);
      const zoomData = user.integrations?.zoom;

      if (!zoomData || !zoomData.connected) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเชื่อมต่อ Zoom ก่อน'
        });
      }

      const meetingResponse = await axios.post(
        `https://api.zoom.us/v2/users/${zoomData.userId}/meetings`,
        {
          topic,
          type: 2, // Scheduled meeting
          start_time: startTime,
          duration,
          timezone: 'Asia/Bangkok',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            watermark: false,
            use_pmi: false,
            approval_type: 0,
            audio: 'both',
            auto_recording: 'cloud'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${zoomData.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const meeting = meetingResponse.data;

      // Save meeting info to booking
      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, {
          'virtualMeeting.platform': 'zoom',
          'virtualMeeting.meetingId': meeting.id,
          'virtualMeeting.joinUrl': meeting.join_url,
          'virtualMeeting.startUrl': meeting.start_url,
          'virtualMeeting.password': meeting.password
        });
      }

      res.json({
        success: true,
        message: 'สร้างห้องประชุม Zoom สำเร็จ',
        data: {
          meetingId: meeting.id,
          joinUrl: meeting.join_url,
          startUrl: meeting.start_url,
          password: meeting.password
        }
      });

    } catch (error) {
      console.error('Create Zoom meeting error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างห้องประชุม'
      });
    }
  }

  // ==================== SOCIAL MEDIA INTEGRATIONS ====================

  // Connect Instagram
  async connectInstagram(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { accessToken, userId } = req.body;

      // Verify token with Instagram
      const verifyResponse = await axios.get(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
      );

      if (verifyResponse.data.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Instagram token ไม่ถูกต้อง'
        });
      }

      await Trainer.findByIdAndUpdate(trainerId, {
        'socialMedia.instagram': {
          connected: true,
          userId: verifyResponse.data.id,
          username: verifyResponse.data.username,
          accessToken,
          connectedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'เชื่อมต่อ Instagram สำเร็จ'
      });

    } catch (error) {
      console.error('Connect Instagram error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Instagram'
      });
    }
  }

  // ==================== ANALYTICS INTEGRATIONS ====================

  // Connect Google Analytics
  async connectGoogleAnalytics(req, res) {
    try {
      const userId = req.user.userId;
      const { propertyId, measurementId } = req.body;

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'เฉพาะแอดมินเท่านั้นที่สามารถเชื่อมต่อ Google Analytics'
        });
      }

      await SystemSettings.findOneAndUpdate(
        {},
        {
          'integrations.googleAnalytics': {
            connected: true,
            propertyId,
            measurementId,
            connectedAt: new Date()
          }
        },
        { upsert: true }
      );

      res.json({
        success: true,
        message: 'เชื่อมต่อ Google Analytics สำเร็จ'
      });

    } catch (error) {
      console.error('Connect Google Analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Analytics'
      });
    }
  }

  // ==================== WEBHOOKS ====================

  // Handle Fitbit webhook
  async handleFitbitWebhook(req, res) {
    try {
      const { ownerId, ownerType, collectionType, date } = req.body;

      // Verify webhook signature
      const signature = req.headers['x-fitbit-signature'];
      const expectedSignature = crypto
        .createHmac('sha1', process.env.FITBIT_CLIENT_SECRET)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (signature !== expectedSignature) {
        return res.status(401).json({ success: false });
      }

      // Find user by Fitbit ID
      const user = await User.findOne({
        'integrations.fitbit.userId': ownerId
      });

      if (user) {
        // Sync new data
        await this.syncFitbitData(user._id);
      }

      res.status(204).send();

    } catch (error) {
      console.error('Handle Fitbit webhook error:', error);
      res.status(500).json({ success: false });
    }
  }

  // Handle Stripe webhook
  async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          endpointSecret
        );
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Webhook Error: ${err.message}`
        });
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'account.updated':
          await this.handleStripeAccountUpdate(event.data.object);
          break;
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Handle Stripe webhook error:', error);
      res.status(500).json({ success: false });
    }
  }

  // ==================== INTEGRATION MANAGEMENT ====================

  // Get integration status
  async getIntegrationStatus(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      const user = await User.findById(userId);
      const integrations = user.integrations || {};

      const status = {
        fitness: {
          fitbit: integrations.fitbit?.connected || false,
          appleHealth: integrations.appleHealth?.connected || false,
          garmin: integrations.garmin?.connected || false,
          googleFit: integrations.googleFit?.connected || false
        },
        nutrition: {
          myfitnesspal: integrations.myfitnesspal?.connected || false,
          cronometer: integrations.cronometer?.connected || false
        },
        calendar: {
          googleCalendar: integrations.googleCalendar?.connected || false,
          outlook: integrations.outlook?.connected || false
        },
        communication: {
          zoom: integrations.zoom?.connected || false,
          googleMeet: integrations.googleMeet?.connected || false
        }
      };

      if (userRole === 'trainer') {
        const trainer = await Trainer.findOne({ userId });
        
        status.payment = {
          stripe: trainer.paymentIntegrations?.stripe?.connected || false,
          paypal: trainer.paymentIntegrations?.paypal?.connected || false
        };

        status.social = {
          instagram: trainer.socialMedia?.instagram?.connected || false,
          facebook: trainer.socialMedia?.facebook?.connected || false,
          youtube: trainer.socialMedia?.youtube?.connected || false
        };
      }

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Get integration status error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงสถานะการเชื่อมต่อ'
      });
    }
  }

  // Disconnect integration
  async disconnectIntegration(req, res) {
    try {
      const userId = req.user.userId;
      const { service } = req.params;

      const updatePath = `integrations.${service}`;
      
      await User.findByIdAndUpdate(userId, {
        [updatePath]: {
          connected: false,
          disconnectedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: `ยกเลิกการเชื่อมต่อ ${service} สำเร็จ`
      });

    } catch (error) {
      console.error('Disconnect integration error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ'
      });
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  // Encrypt sensitive data
  encryptData(data) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  decryptData(encryptedData) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Refresh OAuth token
  async refreshOAuthToken(service, refreshToken) {
    const tokenEndpoints = {
      fitbit: 'https://api.fitbit.com/oauth2/token',
      zoom: 'https://zoom.us/oauth/token',
      google: 'https://oauth2.googleapis.com/token'
    };

    const clientCredentials = {
      fitbit: {
        client_id: process.env.FITBIT_CLIENT_ID,
        client_secret: process.env.FITBIT_CLIENT_SECRET
      },
      zoom: {
        client_id: process.env.ZOOM_CLIENT_ID,
        client_secret: process.env.ZOOM_CLIENT_SECRET
      },
      google: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET
      }
    };

    try {
      const response = await axios.post(
        tokenEndpoints[service],
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          ...clientCredentials[service]
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Refresh ${service} token error:`, error);
      throw error;
    }
  }

  // Handle payment success
  async handlePaymentSuccess(paymentIntent) {
    const { metadata } = paymentIntent;
    
    // Update payment status
    await Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      {
        status: 'completed',
        completedAt: new Date()
      }
    );

    // Update booking status
    if (metadata.bookingId) {
      await Booking.findByIdAndUpdate(
        metadata.bookingId,
        { status: 'confirmed' }
      );
    }
  }

  // Handle payment failure
  async handlePaymentFailure(paymentIntent) {
    await Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message
      }
    );
  }

  // Handle Stripe account update
  async handleStripeAccountUpdate(account) {
    await Trainer.findOneAndUpdate(
      { 'paymentIntegrations.stripe.accountId': account.id },
      {
        'paymentIntegrations.stripe.payoutsEnabled': account.payouts_enabled,
        'paymentIntegrations.stripe.chargesEnabled': account.charges_enabled
      }
    );
  }

  // Sync MyFitnessPal data (web scraping placeholder)
  async syncMyFitnessPalData(userId, date) {
    // This would implement web scraping
    // For now, return sample data
    return {
      totalCalories: 2000,
      totalProtein: 150,
      totalCarbs: 200,
      totalFat: 67,
      totalFiber: 25,
      meals: [
        {
          name: 'Breakfast',
          calories: 500,
          protein: 30,
          carbs: 60,
          fat: 15
        },
        {
          name: 'Lunch',
          calories: 700,
          protein: 50,
          carbs: 70,
          fat: 25
        },
        {
          name: 'Dinner',
          calories: 600,
          protein: 50,
          carbs: 50,
          fat: 20
        },
        {
          name: 'Snacks',
          calories: 200,
          protein: 20,
          carbs: 20,
          fat: 7
        }
      ]
    };
  }

  // Sync Garmin data
  async syncGarminData(userId) {
    // Implement Garmin Connect API integration
    // This is a placeholder
    return {
      steps: 10000,
      distance: 7.5,
      activeCalories: 500,
      heartRate: 65
    };
  }

  // Sync Cronometer data
  async syncCronometerData(userId, date) {
    // Implement Cronometer API integration
    // This is a placeholder
    return {
      totalCalories: 1800,
      totalProtein: 140,
      totalCarbs: 180,
      totalFat: 60,
      micronutrients: {
        vitaminC: 100,
        vitaminD: 20,
        iron: 15,
        calcium: 1000
      }
    };
  }
}

module.exports = new IntegrationController();
