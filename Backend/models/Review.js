const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    knowledge: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    motivation: {
      type: Number,
      min: 1,
      max: 5
    },
    results: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  title: {
    type: String,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  pros: [String],
  cons: [String],
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  achievements: {
    weightLoss: Number, // in kg
    muscleGain: Number, // in kg
    fitnessImprovement: String,
    otherAchievements: [String]
  },
  photos: [{
    url: String,
    publicId: String,
    caption: String,
    type: {
      type: String,
      enum: ['before', 'after', 'progress', 'general']
    }
  }],
  trainerResponse: {
    comment: String,
    respondedAt: Date,
    isAppropriate: {
      type: Boolean,
      default: true
    }
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  inappropriate: {
    isReported: {
      type: Boolean,
      default: false
    },
    reportedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      reportedAt: Date
    }],
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: String
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'hidden'],
    default: 'public'
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  completionPercentage: Number, // How much of the package was completed
  metadata: {
    platform: {
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
reviewSchema.index({ trainer: 1, createdAt: -1 });
reviewSchema.index({ client: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ visibility: 1, 'inappropriate.reviewStatus': 1 });

// Ensure one review per booking
reviewSchema.index({ booking: 1, client: 1 }, { unique: true });

// Calculate average rating before save
reviewSchema.pre('save', function(next) {
  const ratings = [
    this.rating.overall,
    this.rating.punctuality,
    this.rating.knowledge,
    this.rating.communication,
    this.rating.motivation,
    this.rating.results
  ].filter(r => r !== undefined);
  
  if (ratings.length > 1) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    this.rating.overall = Math.round((sum / ratings.length) * 10) / 10;
  }
  
  next();
});

// Update trainer statistics after save
reviewSchema.post('save', async function() {
  const Trainer = require('./Trainer');
  const trainer = await Trainer.findById(this.trainer);
  if (trainer) {
    await trainer.updateStatistics();
  }
});

// Methods
reviewSchema.methods.markAsHelpful = async function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    await this.save();
    return true;
  }
  return false;
};

reviewSchema.methods.reportInappropriate = async function(userId, reason) {
  const existingReport = this.inappropriate.reportedBy.find(
    report => report.user.toString() === userId.toString()
  );
  
  if (!existingReport) {
    this.inappropriate.reportedBy.push({
      user: userId,
      reason: reason,
      reportedAt: new Date()
    });
    
    // Auto-flag for review if multiple reports
    if (this.inappropriate.reportedBy.length >= 3) {
      this.inappropriate.isReported = true;
      this.inappropriate.reviewStatus = 'pending';
    }
    
    await this.save();
    return true;
  }
  return false;
};

// Statics
reviewSchema.statics.getTrainerStats = async function(trainerId) {
  const stats = await this.aggregate([
    { $match: { trainer: mongoose.Types.ObjectId(trainerId), visibility: 'public' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageOverall: { $avg: '$rating.overall' },
        averagePunctuality: { $avg: '$rating.punctuality' },
        averageKnowledge: { $avg: '$rating.knowledge' },
        averageCommunication: { $avg: '$rating.communication' },
        averageMotivation: { $avg: '$rating.motivation' },
        averageResults: { $avg: '$rating.results' },
        recommendationRate: {
          $avg: { $cond: ['$wouldRecommend', 1, 0] }
        },
        distribution: {
          $push: '$rating.overall'
        }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRatings: {
          overall: { $round: ['$averageOverall', 1] },
          punctuality: { $round: ['$averagePunctuality', 1] },
          knowledge: { $round: ['$averageKnowledge', 1] },
          communication: { $round: ['$averageCommunication', 1] },
          motivation: { $round: ['$averageMotivation', 1] },
          results: { $round: ['$averageResults', 1] }
        },
        recommendationRate: { $multiply: ['$recommendationRate', 100] },
        ratingDistribution: {
          5: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $and: [{ $gte: ['$$this', 4] }, { $lt: ['$$this', 5] }] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $and: [{ $gte: ['$$this', 3] }, { $lt: ['$$this', 4] }] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $and: [{ $gte: ['$$this', 2] }, { $lt: ['$$this', 3] }] }
              }
            }
          },
          1: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $and: [{ $gte: ['$$this', 1] }, { $lt: ['$$this', 2] }] }
              }
            }
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalReviews: 0,
    averageRatings: {
      overall: 0,
      punctuality: 0,
      knowledge: 0,
      communication: 0,
      motivation: 0,
      results: 0
    },
    recommendationRate: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
};

module.exports = mongoose.model('Review', reviewSchema);