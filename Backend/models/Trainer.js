const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  specializations: [{
    type: String,
    enum: [
      'weight-loss',
      'muscle-building',
      'cardio',
      'yoga',
      'pilates',
      'crossfit',
      'boxing',
      'swimming',
      'running',
      'cycling',
      'functional-training',
      'rehabilitation',
      'nutrition',
      'strength-training',
      'flexibility',
      'sports-specific',
      'elderly-fitness',
      'prenatal-fitness',
      'postnatal-fitness',
      'kids-fitness'
    ]
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    organization: String,
    issueDate: Date,
    expiryDate: Date,
    certificateNumber: String,
    imageUrl: String
  }],
  experience: {
    years: {
      type: Number,
      min: 0
    },
    description: String
  },
  education: [{
    degree: String,
    field: String,
    institution: String,
    graduationYear: Number
  }],
  languages: [{
    type: String,
    enum: ['thai', 'english', 'chinese', 'japanese', 'korean', 'spanish', 'french', 'german']
  }],
  services: [{
    type: String,
    enum: [
      'personal-training',
      'group-training',
      'online-training',
      'nutrition-planning',
      'fitness-assessment',
      'workout-planning',
      'home-visit',
      'gym-training'
    ]
  }],
  availability: {
    schedule: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6 // 0 = Sunday, 6 = Saturday
      },
      slots: [{
        startTime: String, // Format: "HH:mm"
        endTime: String,
        isAvailable: {
          type: Boolean,
          default: true
        }
      }]
    }],
    blackoutDates: [{
      date: Date,
      reason: String
    }]
  },
  pricing: {
    currency: {
      type: String,
      default: 'THB'
    },
    sessionRates: {
      personal: {
        single: Number,
        package5: Number,
        package10: Number,
        package20: Number
      },
      group: {
        perPerson: Number,
        minPersons: Number,
        maxPersons: Number
      },
      online: {
        single: Number,
        monthly: Number
      }
    }
  },
  workLocations: [{
    type: {
      type: String,
      enum: ['gym', 'home-visit', 'outdoor', 'online']
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym'
    },
    areasCovered: [String], // For home visits
    details: String
  }],
  gallery: [{
    url: String,
    publicId: String,
    caption: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  achievements: [{
    title: String,
    description: String,
    date: Date,
    imageUrl: String
  }],
  statistics: {
    totalClients: {
      type: Number,
      default: 0
    },
    activeClients: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    cancelledSessions: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  bankAccount: {
    bankName: String,
    accountName: String,
    accountNumber: String,
    branch: String
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    line: String,
    youtube: String,
    tiktok: String
  },
  preferences: {
    clientGenderPreference: {
      type: String,
      enum: ['male', 'female', 'no-preference'],
      default: 'no-preference'
    },
    ageGroupPreference: [{
      type: String,
      enum: ['kids', 'teens', 'adults', 'seniors']
    }],
    maxConcurrentClients: {
      type: Number,
      default: 20
    },
    autoAcceptBookings: {
      type: Boolean,
      default: false
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'pro'],
      default: 'basic'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: {
        type: String,
        enum: ['id-card', 'certification', 'insurance', 'other']
      },
      url: String,
      uploadDate: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      reviewNotes: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  searchTags: [String]
}, {
  timestamps: true
});

// Indexes for search optimization
trainerSchema.index({ 'userId': 1 });
trainerSchema.index({ 'specializations': 1 });
trainerSchema.index({ 'services': 1 });
trainerSchema.index({ 'workLocations.areasCovered': 1 });
trainerSchema.index({ 'statistics.averageRating': -1 });
trainerSchema.index({ 'isActive': 1, 'verificationStatus.isVerified': 1 });
trainerSchema.index({ 'searchTags': 'text', 'bio': 'text' });

// Virtual populate for user data
trainerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to update statistics
trainerSchema.methods.updateStatistics = async function() {
  const Booking = require('./Booking');
  const Review = require('./Review');
  
  // Update session statistics
  const bookingStats = await Booking.aggregate([
    { $match: { trainer: this._id } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] }
        }
      }
    }
  ]);
  
  // Update review statistics
  const reviewStats = await Review.aggregate([
    { $match: { trainer: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (bookingStats.length > 0) {
    this.statistics.totalSessions = bookingStats[0].totalSessions;
    this.statistics.completedSessions = bookingStats[0].completedSessions;
    this.statistics.cancelledSessions = bookingStats[0].cancelledSessions;
    this.statistics.totalRevenue = bookingStats[0].totalRevenue;
  }
  
  if (reviewStats.length > 0) {
    this.statistics.averageRating = Math.round(reviewStats[0].averageRating * 10) / 10;
    this.statistics.totalReviews = reviewStats[0].totalReviews;
  }
  
  await this.save();
};

module.exports = mongoose.model('Trainer', trainerSchema);