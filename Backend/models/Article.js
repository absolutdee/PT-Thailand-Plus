const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  excerpt: {
    type: String,
    maxlength: 300,
    required: [true, 'Article excerpt is required']
  },
  content: {
    type: String,
    required: [true, 'Article content is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: [
      'fitness-tips',
      'nutrition',
      'workout-guides',
      'weight-loss',
      'muscle-building',
      'yoga',
      'cardio',
      'mental-health',
      'recovery',
      'equipment-reviews',
      'success-stories',
      'expert-interviews',
      'health-science',
      'lifestyle',
      'recipes'
    ],
    required: true
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  featuredImage: {
    url: {
      type: String,
      required: true
    },
    publicId: String,
    caption: String,
    alt: String
  },
  images: [{
    url: String,
    publicId: String,
    caption: String,
    alt: String,
    position: Number
  }],
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  relatedTrainers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  }],
  readingTime: {
    type: Number, // in minutes
    default: 5
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels']
  },
  targetAudience: [{
    type: String,
    enum: ['men', 'women', 'seniors', 'youth', 'athletes', 'beginners', 'everyone']
  }],
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    focusKeyword: String,
    canonicalUrl: String,
    ogImage: String
  },
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    avgTimeOnPage: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    }
  },
  engagement: {
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    bookmarkedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sharedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      platform: {
        type: String,
        enum: ['facebook', 'twitter', 'line', 'whatsapp', 'email', 'copy-link']
      },
      sharedAt: Date
    }]
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: {
        type: String,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    isApproved: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  scheduledAt: Date,
  visibility: {
    type: String,
    enum: ['public', 'members-only', 'premium'],
    default: 'public'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSticky: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['th', 'en'],
    default: 'th'
  },
  translations: [{
    language: String,
    title: String,
    excerpt: String,
    content: String,
    slug: String
  }],
  sources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['research', 'article', 'book', 'website', 'expert']
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  revisions: [{
    version: Number,
    content: String,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: Date,
    changeNote: String
  }],
  metadata: {
    wordCount: Number,
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    importedFrom: String,
    originalUrl: String
  }
}, {
  timestamps: true
});

// Indexes
articleSchema.index({ slug: 1 });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ category: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ author: 1 });
articleSchema.index({ 'statistics.views': -1 });
articleSchema.index({ isFeatured: 1, isSticky: 1 });
articleSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Generate slug before save
articleSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Calculate reading time
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
    this.metadata.wordCount = wordCount;
  }
  
  // Set published date
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Update statistics
articleSchema.methods.incrementView = async function(userId = null) {
  this.statistics.views += 1;
  await this.save();
};

articleSchema.methods.toggleLike = async function(userId) {
  const index = this.engagement.likedBy.indexOf(userId);
  
  if (index > -1) {
    this.engagement.likedBy.splice(index, 1);
    this.statistics.likes = Math.max(0, this.statistics.likes - 1);
  } else {
    this.engagement.likedBy.push(userId);
    this.statistics.likes += 1;
  }
  
  await this.save();
  return index === -1; // Return true if liked, false if unliked
};

articleSchema.methods.toggleBookmark = async function(userId) {
  const index = this.engagement.bookmarkedBy.indexOf(userId);
  
  if (index > -1) {
    this.engagement.bookmarkedBy.splice(index, 1);
  } else {
    this.engagement.bookmarkedBy.push(userId);
  }
  
  await this.save();
  return index === -1; // Return true if bookmarked, false if unbookmarked
};

articleSchema.methods.addComment = async function(userId, content) {
  const comment = {
    user: userId,
    content: content,
    createdAt: new Date()
  };
  
  this.comments.push(comment);
  this.statistics.comments = this.comments.filter(c => !c.isDeleted).length;
  
  await this.save();
  return comment;
};

articleSchema.methods.recordShare = async function(userId, platform) {
  this.engagement.sharedBy.push({
    user: userId,
    platform: platform,
    sharedAt: new Date()
  });
  
  this.statistics.shares += 1;
  await this.save();
};

// Get related articles
articleSchema.methods.getRelatedArticles = async function(limit = 5) {
  const Article = this.constructor;
  
  // Find articles with similar tags or category
  const related = await Article.find({
    _id: { $ne: this._id },
    status: 'published',
    $or: [
      { category: this.category },
      { tags: { $in: this.tags } }
    ]
  })
  .sort({ 'statistics.views': -1 })
  .limit(limit)
  .select('title slug excerpt featuredImage category readingTime publishedAt');
  
  return related;
};

// Static methods
articleSchema.statics.getPopular = async function(options = {}) {
  const {
    limit = 10,
    timeframe = 30, // days
    category = null
  } = options;
  
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - timeframe);
  
  const query = {
    status: 'published',
    publishedAt: { $gte: dateThreshold }
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ 'statistics.views': -1 })
    .limit(limit)
    .populate('author', 'name profileImage');
};

articleSchema.statics.getTrending = async function(limit = 5) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - 7); // Last 7 days
  
  return this.aggregate([
    {
      $match: {
        status: 'published',
        publishedAt: { $gte: dateThreshold }
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            '$statistics.views',
            { $multiply: ['$statistics.likes', 2] },
            { $multiply: ['$statistics.shares', 3] },
            { $multiply: ['$statistics.comments', 2] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: '$author'
    },
    {
      $project: {
        title: 1,
        slug: 1,
        excerpt: 1,
        featuredImage: 1,
        category: 1,
        readingTime: 1,
        publishedAt: 1,
        'author.name': 1,
        'author.profileImage': 1,
        engagementScore: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Article', articleSchema);
