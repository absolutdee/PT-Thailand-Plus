const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  sessions: [{
    sessionNumber: {
      type: Number,
      required: true
    },
    scheduledDate: Date,
    scheduledTime: {
      start: String,
      end: String
    },
    actualDate: Date,
    actualTime: {
      start: String,
      end: String
    },
    location: {
      type: {
        type: String,
        enum: ['gym', 'home', 'outdoor', 'online']
      },
      address: String,
      gymId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym'
      },
      onlineLink: String
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'],
      default: 'scheduled'
    },
    notes: String,
    trainerNotes: String,
    clientFeedback: String,
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    rescheduledFrom: Date,
    rescheduledReason: String
  }],
  pricing: {
    packagePrice: {
      type: Number,
      required: true
    },
    discount: {
      amount: Number,
      percentage: Number,
      code: String,
      reason: String
    },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'THB'
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'bank-transfer', 'cash', 'promptpay'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'failed'],
      default: 'pending'
    },
    transactions: [{
      transactionId: String,
      amount: Number,
      date: Date,
      type: {
        type: String,
        enum: ['payment', 'refund']
      },
      method: String,
      status: String,
      reference: String
    }],
    dueDate: Date,
    paidAmount: {
      type: Number,
      default: 0
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  nutritionPlan: {
    isIncluded: {
      type: Boolean,
      default: false
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NutritionPlan'
    }
  },
  workoutPlan: {
    isIncluded: {
      type: Boolean,
      default: false
    },
    plans: [{
      week: Number,
      exercises: [{
        name: String,
        sets: Number,
        reps: String,
        rest: String,
        notes: String
      }]
    }]
  },
  progress: {
    initialAssessment: {
      date: Date,
      weight: Number,
      bodyFat: Number,
      measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        arms: Number,
        thighs: Number
      },
      fitnessTests: [{
        testName: String,
        result: String,
        score: Number
      }],
      photos: [{
        url: String,
        type: String // front, side, back
      }]
    },
    checkpoints: [{
      date: Date,
      weight: Number,
      bodyFat: Number,
      measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        arms: Number,
        thighs: Number
      },
      notes: String,
      photos: [{
        url: String,
        type: String
      }]
    }],
    finalAssessment: {
      date: Date,
      weight: Number,
      bodyFat: Number,
      measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        arms: Number,
        thighs: Number
      },
      fitnessTests: [{
        testName: String,
        result: String,
        score: Number
      }],
      photos: [{
        url: String,
        type: String
      }],
      summary: String
    }
  },
  communication: {
    preferredChannel: {
      type: String,
      enum: ['in-app', 'email', 'sms', 'line', 'phone'],
      default: 'in-app'
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    refundStatus: String,
    refundAmount: Number
  },
  review: {
    isReviewed: {
      type: Boolean,
      default: false
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  },
  notes: {
    clientNotes: String,
    trainerNotes: String,
    adminNotes: String
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'admin'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ trainer: 1, status: 1 });
bookingSchema.index({ 'sessions.scheduledDate': 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

// Generate booking number
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingNumber = `BK${year}${month}${random}`;
  }
  next();
});

// Calculate total amount
bookingSchema.pre('save', function(next) {
  if (this.isModified('pricing')) {
    let total = this.pricing.packagePrice;
    
    // Apply discount
    if (this.pricing.discount) {
      if (this.pricing.discount.percentage) {
        total -= (total * this.pricing.discount.percentage / 100);
      } else if (this.pricing.discount.amount) {
        total -= this.pricing.discount.amount;
      }
    }
    
    // Add additional charges
    if (this.pricing.additionalCharges && this.pricing.additionalCharges.length > 0) {
      this.pricing.additionalCharges.forEach(charge => {
        total += charge.amount;
      });
    }
    
    this.pricing.totalAmount = Math.max(0, total);
  }
  next();
});

// Methods
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const startDate = new Date(this.startDate);
  const hoursBefore = 24; // 24 hours cancellation policy
  const cancellationDeadline = new Date(startDate.getTime() - (hoursBefore * 60 * 60 * 1000));
  
  return now < cancellationDeadline && 
         ['pending', 'confirmed', 'active'].includes(this.status);
};

bookingSchema.methods.canBeRescheduled = function(sessionNumber) {
  const session = this.sessions.find(s => s.sessionNumber === sessionNumber);
  if (!session) return false;
  
  const now = new Date();
  const sessionDate = new Date(session.scheduledDate);
  const hoursBefore = 12; // 12 hours reschedule policy
  const rescheduleDeadline = new Date(sessionDate.getTime() - (hoursBefore * 60 * 60 * 1000));
  
  return now < rescheduleDeadline && 
         session.status === 'scheduled' &&
         this.status === 'active';
};

bookingSchema.methods.calculateRefund = function() {
  if (!this.canBeCancelled()) return 0;
  
  const completedSessions = this.sessions.filter(s => s.status === 'completed').length;
  const totalSessions = this.sessions.length;
  const remainingSessions = totalSessions - completedSessions;
  
  const perSessionCost = this.pricing.totalAmount / totalSessions;
  let refundAmount = perSessionCost * remainingSessions;
  
  // Apply cancellation fee (10%)
  const cancellationFee = refundAmount * 0.1;
  refundAmount -= cancellationFee;
  
  return Math.max(0, refundAmount);
};

bookingSchema.methods.getUpcomingSessions = function() {
  const now = new Date();
  return this.sessions.filter(session => 
    new Date(session.scheduledDate) > now && 
    session.status === 'scheduled'
  ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
};

bookingSchema.methods.getCompletionPercentage = function() {
  const completedSessions = this.sessions.filter(s => s.status === 'completed').length;
  return Math.round((completedSessions / this.sessions.length) * 100);
};

module.exports = mongoose.model('Booking', bookingSchema);