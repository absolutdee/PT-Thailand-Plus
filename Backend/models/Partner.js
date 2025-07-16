const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Partner name is required'],
    unique: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: [
      'corporate',
      'insurance',
      'equipment-supplier',
      'nutrition-brand',
      'wellness-center',
      'media-partner',
      'technology-partner',
      'payment-provider',
      'educational-institution'
    ],
    required: true
  },
  description: {
    short: {
      type: String,
      maxlength: 300
    },
    full: String
  },
  logo: {
    url: {
      type: String,
      required: true
    },
    publicId: String,
    darkVersion: {
      url: String,
      publicId: String
    }
  },
  contact: {
    primaryContact: {
      name: {
        type: String,
        required: true
      },
      position: String,
      email: {
        type: String,
        required: true
      },
      phone: String,
      line: String
    },
    secondaryContacts: [{
      name: String,
      position: String,
      email: String,
      phone: String,
      department: String
    }],
    companyInfo: {
      registrationNumber: String,
      taxId: String,
      address: {
        street: String,
        district: String,
        province: String,
        zipCode: String,
        country: {
          type: String,
          default: 'Thailand'
        }
      },
      website: String,
      socialMedia: {
        facebook: String,
        instagram: String,
        linkedin: String,
        youtube: String
      }
    }
  },
  partnership: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'expired', 'terminated'],
      default: 'pending'
    },
    tier: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'bronze', 'basic'],
      default: 'basic'
    },
    agreement: {
      documentUrl: String,
      signedDate: Date,
      signedBy: {
        partner: String,
        platform: String
      }
    },
    renewalStatus: {
      autoRenew: {
        type: Boolean,
        default: false
      },
      reminderSent: {
        type: Boolean,
        default: false
      },
      renewalDate: Date
    }
  },
  benefits: {
    forPartner: [{
      title: String,
      description: String,
      value: String
    }],
    forUsers: [{
      title: String,
      description: String,
      conditions: String
    }]
  },
  offers: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['discount', 'free-trial', 'bundled', 'exclusive', 'cashback']
    },
    discount: {
      percentage: Number,
      amount: Number,
      code: String
    },
    validity: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    },
    terms: [String],
    eligibility: {
      userTypes: [{
        type: String,
        enum: ['all', 'new', 'existing', 'premium']
      }],
      minPurchase: Number,
      specificProducts: [String]
    },
    redemption: {
      method: {
        type: String,
        enum: ['automatic', 'code', 'link', 'manual']
      },
      maxRedemptions: Number,
      currentRedemptions: {
        type: Number,
        default: 0
      },
      perUserLimit: Number
    },
    trackingUrl: String,
    landingPage: String
  }],
  commissions: {
    structure: {
      type: String,
      enum: ['percentage', 'fixed', 'tiered', 'hybrid']
    },
    rates: [{
      type: {
        type: String,
        enum: ['referral', 'sales', 'signup']
      },
      rate: Number,
      fixedAmount: Number,
      conditions: String
    }],
    paymentTerms: {
      frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly']
      },
      minimumPayout: Number,
      paymentMethod: String
    }
  },
  performance: {
    metrics: {
      totalReferrals: {
        type: Number,
        default: 0
      },
      successfulConversions: {
        type: Number,
        default: 0
      },
      totalRevenue: {
        type: Number,
        default: 0
      },
      totalCommissionPaid: {
        type: Number,
        default: 0
      },
      conversionRate: {
        type: Number,
        default: 0
      }
    },
    monthlyStats: [{
      month: Date,
      referrals: Number,
      conversions: Number,
      revenue: Number,
      commission: Number
    }],
    topPerformingOffers: [{
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner.offers'
      },
      redemptions: Number,
      revenue: Number
    }]
  },
  marketing: {
    materials: [{
      type: {
        type: String,
        enum: ['banner', 'video', 'brochure', 'email-template', 'social-media-kit']
      },
      name: String,
      url: String,
      dimensions: String,
      format: String,
      uploadedAt: Date
    }],
    campaigns: [{
      name: String,
      startDate: Date,
      endDate: Date,
      budget: Number,
      channels: [String],
      results: {
        impressions: Number,
        clicks: Number,
        conversions: Number,
        roi: Number
      }
    }],
    cobranding: {
      guidelines: String,
      approvedLogos: [{
        url: String,
        usage: String
      }]
    }
  },
  integration: {
    apiAccess: {
      enabled: {
        type: Boolean,
        default: false
      },
      apiKey: String,
      webhooks: [{
        event: String,
        url: String,
        isActive: Boolean
      }],
      rateLimit: Number
    },
    technicalContact: {
      name: String,
      email: String,
      phone: String
    },
    documentation: String
  },
  display: {
    showOnHomepage: {
      type: Boolean,
      default: false
    },
    homepageOrder: Number,
    showInFooter: {
      type: Boolean,
      default: false
    },
    dedicatedPage: {
      enabled: {
        type: Boolean,
        default: false
      },
      customUrl: String,
      template: String
    }
  },
  compliance: {
    dataSharing: {
      agreement: Boolean,
      scope: [String],
      signedDate: Date
    },
    gdpr: {
      compliant: Boolean,
      dpa: String // Data Processing Agreement
    },
    liability: {
      insurance: String,
      coverage: Number,
      validUntil: Date
    }
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['general', 'issue', 'meeting', 'renewal']
    }
  }],
  tags: [String],
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
partnerSchema.index({ slug: 1 });
partnerSchema.index({ type: 1 });
partnerSchema.index({ 'partnership.status': 1 });
partnerSchema.index({ 'partnership.tier': 1 });
partnerSchema.index({ isActive: 1 });
partnerSchema.index({ name: 'text', 'description.full': 'text' });

// Generate slug
partnerSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Calculate conversion rate
  if (this.performance.metrics.totalReferrals > 0) {
    this.performance.metrics.conversionRate = 
      (this.performance.metrics.successfulConversions / this.performance.metrics.totalReferrals) * 100;
  }
  
  next();
});

// Methods
partnerSchema.methods.recordReferral = async function() {
  this.performance.metrics.totalReferrals += 1;
  await this.save();
};

partnerSchema.methods.recordConversion = async function(revenue = 0) {
  this.performance.metrics.successfulConversions += 1;
  this.performance.metrics.totalRevenue += revenue;
  
  // Update monthly stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  let monthStat = this.performance.monthlyStats.find(stat => 
    stat.month.getTime() === monthStart.getTime()
  );
  
  if (!monthStat) {
    monthStat = {
      month: monthStart,
      referrals: 0,
      conversions: 0,
      revenue: 0,
      commission: 0
    };
    this.performance.monthlyStats.push(monthStat);
  }
  
  monthStat.conversions += 1;
  monthStat.revenue += revenue;
  
  await this.save();
};

partnerSchema.methods.calculateCommission = function(amount, type = 'sales') {
  const commission = this.commissions.rates.find(r => r.type === type);
  
  if (!commission) return 0;
  
  if (this.commissions.structure === 'percentage' && commission.rate) {
    return amount * (commission.rate / 100);
  } else if (this.commissions.structure === 'fixed' && commission.fixedAmount) {
    return commission.fixedAmount;
  }
  
  return 0;
};

partnerSchema.methods.redeemOffer = async function(offerId, userId) {
  const offer = this.offers.id(offerId);
  
  if (!offer) {
    throw new Error('Offer not found');
  }
  
  if (!offer.validity.isActive) {
    throw new Error('Offer is not active');
  }
  
  if (offer.validity.endDate && offer.validity.endDate < new Date()) {
    throw new Error('Offer has expired');
  }
  
  if (offer.redemption.maxRedemptions && 
      offer.redemption.currentRedemptions >= offer.redemption.maxRedemptions) {
    throw new Error('Offer redemption limit reached');
  }
  
  offer.redemption.currentRedemptions += 1;
  
  // Update top performing offers
  const topOffer = this.performance.topPerformingOffers.find(
    o => o.offerId.toString() === offerId
  );
  
  if (topOffer) {
    topOffer.redemptions += 1;
  } else {
    this.performance.topPerformingOffers.push({
      offerId: offerId,
      redemptions: 1,
      revenue: 0
    });
  }
  
  await this.save();
  return offer;
};

partnerSchema.methods.checkRenewal = function() {
  if (!this.partnership.endDate) return null;
  
  const daysUntilExpiry = Math.ceil(
    (this.partnership.endDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry <= 30 && !this.partnership.renewalStatus.reminderSent) {
    return {
      shouldSendReminder: true,
      daysUntilExpiry: daysUntilExpiry
    };
  }
  
  return {
    shouldSendReminder: false,
    daysUntilExpiry: daysUntilExpiry
  };
};

// Statics
partnerSchema.statics.getActivePartners = async function(type = null) {
  const query = {
    isActive: true,
    'partnership.status': 'active'
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ 'partnership.tier': -1, priority: -1 })
    .select('name slug type logo description.short partnership.tier display');
};

partnerSchema.statics.getPartnersWithActiveOffers = async function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    'partnership.status': 'active',
    'offers': {
      $elemMatch: {
        'validity.isActive': true,
        'validity.startDate': { $lte: now },
        $or: [
          { 'validity.endDate': null },
          { 'validity.endDate': { $gte: now } }
        ]
      }
    }
  }).select('name slug type logo offers');
};

module.exports = mongoose.model('Partner', partnerSchema);