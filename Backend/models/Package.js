const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Package name is required'],
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Package description is required'],
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['personal', 'group', 'online', 'hybrid'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'weight-loss',
      'muscle-building',
      'general-fitness',
      'sports-training',
      'rehabilitation',
      'wellness',
      'transformation'
    ],
    required: true
  },
  duration: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      required: true
    }
  },
  sessionsIncluded: {
    total: {
      type: Number,
      required: true
    },
    perWeek: Number,
    sessionDuration: {
      type: Number, // in minutes
      default: 60
    }
  },
  pricing: {
    originalPrice: {
      type: Number,
      required: true
    },
    salePrice: Number,
    currency: {
      type: String,
      default: 'THB'
    },
    isOnSale: {
      type: Boolean,
      default: false
    },
    saleEndDate: Date
  },
  features: [{
    type: String
  }],
  includes: {
    personalTraining: {
      type: Boolean,
      default: false
    },
    nutritionPlan: {
      type: Boolean,
      default: false
    },
    workoutPlan: {
      type: Boolean,
      default: false
    },
    progressTracking: {
      type: Boolean,
      default: false
    },
    onlineSupport: {
      type: Boolean,
      default: false
    },
    fitnessAssessment: {
      type: Boolean,
      default: false
    },
    customFeatures: [String]
  },
  requirements: {
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
      default: 'all-levels'
    },
    ageGroup: {
      min: Number,
      max: Number
    },
    healthConditions: [String],
    equipment: [String]
  },
  location: {
    type: {
      type: String,
      enum: ['gym', 'home', 'outdoor', 'online', 'flexible']
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym'
    },
    areas: [String] // For home visits
  },
  capacity: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 1
    },
    current: {
      type: Number,
      default: 0
    }
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    fixedSchedule: [{
      dayOfWeek: Number,
      time: String
    }],
    flexibleScheduling: {
      type: Boolean,
      default: true
    }
  },
  terms: {
    cancellationPolicy: String,
    refundPolicy: String,
    makeupSessions: {
      allowed: {
        type: Boolean,
        default: true
      },
      maxNumber: Number,
      conditions: String
    }
  },
  images: [{
    url: String,
    publicId: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  tags: [String],
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: String
  },
  statistics: {
    totalSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: Date
}, {
  timestamps: true
});

// Indexes
packageSchema.index({ trainer: 1, status: 1 });
packageSchema.index({ type: 1, category: 1 });
packageSchema.index({ 'pricing.salePrice': 1 });
packageSchema.index({ isRecommended: 1, isFeatured: 1 });
packageSchema.index({ tags: 1 });
packageSchema.index({ 'seo.slug': 1 });

// Pre-save middleware to generate slug
packageSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Virtual for discount percentage
packageSchema.virtual('discountPercentage').get(function() {
  if (this.pricing.isOnSale && this.pricing.salePrice) {
    return Math.round(
      ((this.pricing.originalPrice - this.pricing.salePrice) / this.pricing.originalPrice) * 100
    );
  }
  return 0;
});

// Virtual for current price
packageSchema.virtual('currentPrice').get(function() {
  if (this.pricing.isOnSale && this.pricing.salePrice && 
      (!this.pricing.saleEndDate || this.pricing.saleEndDate > new Date())) {
    return this.pricing.salePrice;
  }
  return this.pricing.originalPrice;
});

// Method to check availability
packageSchema.methods.checkAvailability = function() {
  const now = new Date();
  
  // Check if package is active
  if (this.status !== 'active') return false;
  
  // Check validity period
  if (this.validFrom && this.validFrom > now) return false;
  if (this.validUntil && this.validUntil < now) return false;
  
  // Check capacity
  if (this.capacity.current >= this.capacity.max) return false;
  
  return true;
};

// Method to update statistics
packageSchema.methods.updateStatistics = async function() {
  const Booking = require('./Booking');
  const Review = require('./Review');
  
  // Get booking statistics
  const bookingStats = await Booking.aggregate([
    { $match: { package: this._id } },
    {
      $group: {
        _id: null,
        totalSold: { $sum: 1 },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Get review statistics  
  const reviewStats = await Review.aggregate([
    { $match: { package: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (bookingStats.length > 0) {
    this.statistics.totalSold = bookingStats[0].totalSold;
    this.statistics.totalRevenue = bookingStats[0].totalRevenue;
    this.statistics.completionRate = bookingStats[0].totalSold > 0 
      ? (bookingStats[0].completed / bookingStats[0].totalSold) * 100 
      : 0;
  }
  
  if (reviewStats.length > 0) {
    this.statistics.averageRating = Math.round(reviewStats[0].averageRating * 10) / 10;
    this.statistics.totalReviews = reviewStats[0].totalReviews;
  }
  
  await this.save();
};

module.exports = mongoose.model('Package', packageSchema);