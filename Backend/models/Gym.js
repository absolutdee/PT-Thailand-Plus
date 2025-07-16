const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Gym name is required'],
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['gym', 'fitness-center', 'yoga-studio', 'boxing-gym', 'crossfit', 'swimming-pool', 'sports-complex'],
    required: true
  },
  description: {
    short: {
      type: String,
      maxlength: 300
    },
    full: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    address: {
      street: {
        type: String,
        required: true
      },
      subDistrict: String,
      district: {
        type: String,
        required: true
      },
      province: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        default: 'Thailand'
      }
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    landmark: String,
    directions: String,
    googleMapsUrl: String,
    plusCode: String
  },
  contact: {
    phone: [{
      number: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['main', 'mobile', 'fax'],
        default: 'main'
      }
    }],
    email: String,
    website: String,
    lineId: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      youtube: String,
      tiktok: String
    }
  },
  operatingHours: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    openTime: String,
    closeTime: String,
    breaks: [{
      startTime: String,
      endTime: String
    }]
  }],
  holidays: [{
    date: Date,
    name: String,
    isOpen: {
      type: Boolean,
      default: false
    },
    specialHours: {
      openTime: String,
      closeTime: String
    }
  }],
  facilities: {
    general: [{
      type: String,
      enum: [
        'free-weights',
        'weight-machines',
        'cardio-machines',
        'functional-area',
        'group-class-studio',
        'yoga-studio',
        'spinning-studio',
        'boxing-ring',
        'swimming-pool',
        'sauna',
        'steam-room',
        'locker-rooms',
        'showers',
        'parking',
        'cafe',
        'pro-shop',
        'personal-training',
        'physiotherapy',
        'massage',
        'childcare'
      ]
    }],
    equipment: [{
      category: {
        type: String,
        enum: ['cardio', 'strength', 'functional', 'accessories']
      },
      items: [{
        name: String,
        brand: String,
        quantity: Number,
        condition: {
          type: String,
          enum: ['excellent', 'good', 'fair'],
          default: 'good'
        }
      }]
    }],
    amenities: [{
      name: String,
      description: String,
      isPremium: {
        type: Boolean,
        default: false
      }
    }]
  },
  trainers: [{
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer'
    },
    isResident: {
      type: Boolean,
      default: true
    },
    specialties: [String],
    availability: String,
    commission: {
      percentage: Number,
      fixedFee: Number
    }
  }],
  membership: {
    plans: [{
      name: {
        type: String,
        required: true
      },
      duration: {
        value: Number,
        unit: {
          type: String,
          enum: ['days', 'months', 'years']
        }
      },
      price: {
        type: Number,
        required: true
      },
      setupFee: {
        type: Number,
        default: 0
      },
      benefits: [String],
      restrictions: [String],
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    dayPass: {
      available: {
        type: Boolean,
        default: true
      },
      price: Number
    },
    guestPolicy: {
      allowed: {
        type: Boolean,
        default: true
      },
      fee: Number,
      restrictions: String
    }
  },
  classes: [{
    name: String,
    type: {
      type: String,
      enum: ['yoga', 'pilates', 'zumba', 'spinning', 'hiit', 'boxing', 'dance', 'other']
    },
    instructor: String,
    schedule: [{
      dayOfWeek: Number,
      time: String,
      duration: Number
    }],
    capacity: Number,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all-levels']
    },
    requiresBooking: {
      type: Boolean,
      default: false
    }
  }],
  images: {
    logo: {
      url: String,
      publicId: String
    },
    cover: {
      url: String,
      publicId: String
    },
    gallery: [{
      url: String,
      publicId: String,
      caption: String,
      area: {
        type: String,
        enum: ['exterior', 'reception', 'gym-floor', 'studio', 'pool', 'locker-room', 'amenities']
      },
      order: Number
    }]
  },
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    documentUrl: String
  }],
  rules: {
    ageRestriction: {
      minAge: Number,
      parentalConsent: Number
    },
    dressCode: [String],
    generalRules: [String],
    safetyGuidelines: [String]
  },
  reviews: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    ratings: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  pricing: {
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$']
    },
    currency: {
      type: String,
      default: 'THB'
    }
  },
  partnerships: [{
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner'
    },
    type: {
      type: String,
      enum: ['corporate', 'insurance', 'wellness-program']
    },
    discount: Number,
    validUntil: Date
  }],
  statistics: {
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    monthlyVisits: {
      type: Number,
      default: 0
    },
    popularHours: [{
      hour: Number,
      avgOccupancy: Number
    }]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  verification: {
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
        enum: ['business-license', 'insurance', 'safety-certificate']
      },
      url: String,
      uploadedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'closed'],
    default: 'pending'
  },
  temporaryClosure: {
    isTemporarilyClosed: {
      type: Boolean,
      default: false
    },
    reason: String,
    expectedReopenDate: Date
  },
  tags: [String],
  searchRadius: {
    type: Number,
    default: 5 // km
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumFeatures: {
    highlightedListing: {
      type: Boolean,
      default: false
    },
    priorityInSearch: {
      type: Boolean,
      default: false
    },
    detailedAnalytics: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
gymSchema.index({ 'location.coordinates': '2dsphere' });
gymSchema.index({ slug: 1 });
gymSchema.index({ type: 1 });
gymSchema.index({ status: 1 });
gymSchema.index({ 'location.address.district': 1, 'location.address.province': 1 });
gymSchema.index({ 'reviews.averageRating': -1 });
gymSchema.index({ isPremium: 1 });
gymSchema.index({ name: 'text', 'description.full': 'text', tags: 'text' });

// Generate slug
gymSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Methods
gymSchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
  
  // Check holidays first
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const holiday = this.holidays.find(h => 
    h.date.getTime() === today.getTime()
  );
  
  if (holiday) {
    if (!holiday.isOpen) return false;
    if (holiday.specialHours) {
      return currentTime >= holiday.specialHours.openTime && 
             currentTime <= holiday.specialHours.closeTime;
    }
  }
  
  // Check regular hours
  const todayHours = this.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
  
  if (!todayHours || !todayHours.isOpen) return false;
  
  // Check if within operating hours
  if (currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime) {
    // Check breaks
    if (todayHours.breaks && todayHours.breaks.length > 0) {
      for (const breakTime of todayHours.breaks) {
        if (currentTime >= breakTime.startTime && currentTime <= breakTime.endTime) {
          return false;
        }
      }
    }
    return true;
  }
  
  return false;
};

gymSchema.methods.getNextOpenTime = function() {
  const now = new Date();
  let checkDate = new Date(now);
  
  for (let i = 0; i < 7; i++) {
    const dayOfWeek = checkDate.getDay();
    const todayHours = this.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (todayHours && todayHours.isOpen) {
      const currentTime = checkDate.toTimeString().slice(0, 5);
      
      if (i === 0 && currentTime < todayHours.openTime) {
        // Today, before opening
        return {
          date: checkDate,
          time: todayHours.openTime
        };
      } else if (i > 0) {
        // Future day
        checkDate.setHours(parseInt(todayHours.openTime.split(':')[0]));
        checkDate.setMinutes(parseInt(todayHours.openTime.split(':')[1]));
        return {
          date: checkDate,
          time: todayHours.openTime
        };
      }
    }
    
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(0, 0, 0, 0);
  }
  
  return null;
};

gymSchema.methods.addReview = async function(rating) {
  this.reviews.totalReviews += 1;
  this.reviews.ratings[rating] += 1;
  
  // Recalculate average
  let totalScore = 0;
  let totalCount = 0;
  
  for (let i = 1; i <= 5; i++) {
    totalScore += i * this.reviews.ratings[i];
    totalCount += this.reviews.ratings[i];
  }
  
  this.reviews.averageRating = totalCount > 0 ? 
    Math.round((totalScore / totalCount) * 10) / 10 : 0;
  
  await this.save();
};

// Statics
gymSchema.statics.findNearby = async function(coordinates, options = {}) {
  const {
    radius = 5000, // meters
    type = null,
    isOpen = null,
    facilities = [],
    limit = 20
  } = options;
  
  const query = {
    status: 'active',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: radius
      }
    }
  };
  
  if (type) query.type = type;
  if (facilities.length > 0) {
    query['facilities.general'] = { $all: facilities };
  }
  
  const gyms = await this.find(query).limit(limit);
  
  // Filter by open status if requested
  if (isOpen !== null) {
    return gyms.filter(gym => gym.isOpenNow() === isOpen);
  }
  
  return gyms;
};

gymSchema.statics.searchByArea = async function(province, district = null) {
  const query = {
    status: 'active',
    'location.address.province': province
  };
  
  if (district) {
    query['location.address.district'] = district;
  }
  
  return this.find(query)
    .sort({ 'reviews.averageRating': -1, isPremium: -1 });
};

module.exports = mongoose.model('Gym', gymSchema);