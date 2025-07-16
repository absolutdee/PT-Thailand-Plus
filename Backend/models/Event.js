const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    short: {
      type: String,
      required: true,
      maxlength: 300
    },
    full: {
      type: String,
      required: true
    }
  },
  type: {
    type: String,
    enum: [
      'workshop',
      'seminar',
      'competition',
      'marathon',
      'charity-run',
      'fitness-expo',
      'bootcamp',
      'challenge',
      'certification',
      'meetup',
      'online-event'
    ],
    required: true
  },
  category: {
    type: String,
    enum: [
      'fitness',
      'running',
      'cycling',
      'yoga',
      'nutrition',
      'wellness',
      'sports',
      'education',
      'community'
    ],
    required: true
  },
  organizer: {
    type: {
      type: String,
      enum: ['platform', 'trainer', 'partner', 'external'],
      required: true
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'organizer.organizerModel'
    },
    organizerModel: {
      type: String,
      enum: ['User', 'Trainer', 'Partner']
    },
    name: String,
    contact: {
      email: String,
      phone: String,
      line: String
    }
  },
  datetime: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'Asia/Bangkok'
    },
    isAllDay: {
      type: Boolean,
      default: false
    }
  },
  recurrence: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    interval: Number,
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    endDate: Date,
    exceptions: [Date]
  },
  location: {
    type: {
      type: String,
      enum: ['physical', 'online', 'hybrid'],
      required: true
    },
    venue: {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
          type: String,
          default: 'Thailand'
        }
      },
      coordinates: {
        lat: Number,
        lng: Number
      },
      mapUrl: String,
      directions: String
    },
    online: {
      platform: {
        type: String,
        enum: ['zoom', 'google-meet', 'facebook-live', 'youtube-live', 'custom']
      },
      link: String,
      meetingId: String,
      password: String,
      instructions: String
    }
  },
  capacity: {
    min: {
      type: Number,
      default: 1
    },
    max: Number,
    current: {
      type: Number,
      default: 0
    },
    waitlist: {
      enabled: {
        type: Boolean,
        default: false
      },
      max: Number,
      current: {
        type: Number,
        default: 0
      }
    }
  },
  registration: {
    required: {
      type: Boolean,
      default: true
    },
    startDate: Date,
    endDate: Date,
    earlyBirdEndDate: Date,
    requirements: [String],
    formFields: [{
      fieldName: String,
      fieldType: {
        type: String,
        enum: ['text', 'email', 'phone', 'number', 'select', 'checkbox', 'textarea']
      },
      required: Boolean,
      options: [String]
    }]
  },
  pricing: {
    isFree: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      default: 'THB'
    },
    tickets: [{
      name: {
        type: String,
        default: 'General Admission'
      },
      price: {
        type: Number,
        required: true
      },
      earlyBirdPrice: Number,
      description: String,
      benefits: [String],
      quantity: Number,
      sold: {
        type: Number,
        default: 0
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    groupDiscounts: [{
      minPeople: Number,
      discountPercentage: Number
    }]
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ticketType: String,
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'attended', 'no-show', 'cancelled'],
      default: 'registered'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentAmount: Number,
    checkInTime: Date,
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    },
    customFields: Map
  }],
  waitlist: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  speakers: [{
    name: String,
    title: String,
    bio: String,
    photo: String,
    socialLinks: {
      website: String,
      linkedin: String,
      facebook: String,
      instagram: String
    }
  }],
  agenda: [{
    time: String,
    duration: Number, // in minutes
    title: String,
    description: String,
    speaker: String,
    type: {
      type: String,
      enum: ['keynote', 'workshop', 'break', 'networking', 'activity', 'meal']
    }
  }],
  sponsors: [{
    name: String,
    logo: String,
    website: String,
    level: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'bronze', 'partner']
    }
  }],
  media: {
    coverImage: {
      url: String,
      publicId: String
    },
    gallery: [{
      url: String,
      publicId: String,
      caption: String,
      type: {
        type: String,
        enum: ['image', 'video']
      }
    }],
    documents: [{
      name: String,
      url: String,
      type: String,
      size: Number
    }]
  },
  tags: [String],
  targetAudience: [{
    type: String,
    enum: ['beginners', 'intermediate', 'advanced', 'professionals', 'everyone']
  }],
  benefits: [String],
  requirements: {
    age: {
      min: Number,
      max: Number
    },
    fitnessLevel: {
      type: String,
      enum: ['any', 'beginner', 'intermediate', 'advanced']
    },
    equipment: [String],
    other: [String]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String
  },
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    registrations: {
      type: Number,
      default: 0
    },
    attendance: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  notifications: {
    remindersSent: [{
      type: {
        type: String,
        enum: ['1-week', '3-days', '1-day', '1-hour']
      },
      sentAt: Date,
      recipientCount: Number
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'members-only'],
    default: 'public'
  },
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    reason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundPolicy: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ slug: 1 });
eventSchema.index({ 'datetime.start': 1 });
eventSchema.index({ type: 1, category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'organizer.organizerId': 1 });
eventSchema.index({ 'participants.user': 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ title: 'text', 'description.full': 'text' });

// Generate slug
eventSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Update statistics
  if (this.participants) {
    this.statistics.registrations = this.participants.length;
    this.statistics.attendance = this.participants.filter(p => p.status === 'attended').length;
    this.capacity.current = this.participants.filter(p => 
      ['registered', 'confirmed', 'attended'].includes(p.status)
    ).length;
  }
  
  next();
});

// Methods
eventSchema.methods.register = async function(userId, ticketType = null) {
  // Check if already registered
  const existingRegistration = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingRegistration) {
    throw new Error('Already registered for this event');
  }
  
  // Check capacity
  if (this.capacity.max && this.capacity.current >= this.capacity.max) {
    // Add to waitlist
    if (this.capacity.waitlist.enabled && 
        this.waitlist.length < this.capacity.waitlist.max) {
      this.waitlist.push({ user: userId });
      await this.save();
      return { status: 'waitlisted' };
    }
    throw new Error('Event is full');
  }
  
  // Find ticket price
  let price = 0;
  if (!this.pricing.isFree && ticketType) {
    const ticket = this.pricing.tickets.find(t => t.name === ticketType);
    if (!ticket || !ticket.isAvailable) {
      throw new Error('Invalid ticket type');
    }
    
    // Check early bird pricing
    if (ticket.earlyBirdPrice && 
        this.registration.earlyBirdEndDate && 
        new Date() < this.registration.earlyBirdEndDate) {
      price = ticket.earlyBirdPrice;
    } else {
      price = ticket.price;
    }
    
    ticket.sold += 1;
  }
  
  // Add participant
  this.participants.push({
    user: userId,
    ticketType: ticketType,
    paymentAmount: price,
    paymentStatus: this.pricing.isFree ? 'paid' : 'pending'
  });
  
  this.capacity.current += 1;
  await this.save();
  
  return { 
    status: 'registered',
    amount: price,
    registrationId: this.participants[this.participants.length - 1]._id
  };
};

eventSchema.methods.cancelRegistration = async function(userId) {
  const participantIndex = this.participants.findIndex(
    p => p.user.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    throw new Error('Registration not found');
  }
  
  const participant = this.participants[participantIndex];
  
  // Check if can cancel (e.g., 24 hours before event)
  const hoursBefore = 24;
  const cancellationDeadline = new Date(this.datetime.start.getTime() - (hoursBefore * 60 * 60 * 1000));
  
  if (new Date() > cancellationDeadline) {
    throw new Error('Cancellation deadline has passed');
  }
  
  // Update ticket availability
  if (participant.ticketType) {
    const ticket = this.pricing.tickets.find(t => t.name === participant.ticketType);
    if (ticket) {
      ticket.sold = Math.max(0, ticket.sold - 1);
    }
  }
  
  participant.status = 'cancelled';
  this.capacity.current = Math.max(0, this.capacity.current - 1);
  
  // Check waitlist
  if (this.waitlist.length > 0) {
    const nextInLine = this.waitlist.shift();
    // Notify user from waitlist
    await this.save();
    return { 
      status: 'cancelled',
      waitlistNotified: nextInLine.user
    };
  }
  
  await this.save();
  return { status: 'cancelled' };
};

eventSchema.methods.checkIn = async function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('Registration not found');
  }
  
  if (participant.status === 'attended') {
    throw new Error('Already checked in');
  }
  
  participant.status = 'attended';
  participant.checkInTime = new Date();
  
  await this.save();
  return participant;
};

eventSchema.methods.addFeedback = async function(userId, rating, comment) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('Must be a participant to leave feedback');
  }
  
  if (participant.status !== 'attended') {
    throw new Error('Must attend the event to leave feedback');
  }
  
  participant.feedback = {
    rating: rating,
    comment: comment,
    submittedAt: new Date()
  };
  
  // Update average rating
  const feedbacks = this.participants
    .filter(p => p.feedback && p.feedback.rating)
    .map(p => p.feedback.rating);
  
  this.statistics.rating.count = feedbacks.length;
  this.statistics.rating.average = feedbacks.length > 0
    ? feedbacks.reduce((a, b) => a + b) / feedbacks.length
    : 0;
  
  await this.save();
  return participant.feedback;
};

// Statics
eventSchema.statics.getUpcoming = async function(options = {}) {
  const {
    limit = 10,
    category = null,
    type = null,
    location = null
  } = options;
  
  const query = {
    status: 'published',
    'datetime.start': { $gte: new Date() }
  };
  
  if (category) query.category = category;
  if (type) query.type = type;
  if (location) query['location.type'] = location;
  
  return this.find(query)
    .sort({ 'datetime.start': 1 })
    .limit(limit)
    .populate('organizer.organizerId', 'name profileImage');
};

eventSchema.statics.searchNearby = async function(coordinates, radius = 10) {
  // Radius in kilometers
  const kmToRadian = radius / 6378.1;
  
  return this.find({
    status: 'published',
    'location.type': { $in: ['physical', 'hybrid'] },
    'location.venue.coordinates': {
      $geoWithin: {
        $centerSphere: [[coordinates.lng, coordinates.lat], kmToRadian]
      }
    },
    'datetime.start': { $gte: new Date() }
  }).sort({ 'datetime.start': 1 });
};

module.exports = mongoose.model('Event', eventSchema);