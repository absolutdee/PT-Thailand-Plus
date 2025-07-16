const mongoose = require('mongoose');

const nutritionPlanSchema = new mongoose.Schema({
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
    ref: 'Booking'
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  goals: {
    primary: {
      type: String,
      enum: [
        'weight-loss',
        'muscle-gain',
        'maintenance',
        'performance',
        'health-improvement',
        'body-recomposition'
      ],
      required: true
    },
    secondary: [String],
    targetWeight: Number,
    targetBodyFat: Number,
    targetDate: Date
  },
  assessment: {
    currentWeight: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    bodyFat: Number,
    muscleMass: Number,
    bmr: Number, // Basal Metabolic Rate
    tdee: Number, // Total Daily Energy Expenditure
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extra-active']
    },
    medicalConditions: [String],
    allergies: [String],
    foodIntolerances: [String],
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'nut-free', 'low-sodium', 'diabetic']
    }],
    preferences: {
      favoriteFoods: [String],
      dislikedFoods: [String],
      mealFrequency: Number,
      cookingSkill: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
      },
      timeAvailable: {
        type: String,
        enum: ['minimal', 'moderate', 'plenty']
      }
    }
  },
  macros: {
    calories: {
      target: {
        type: Number,
        required: true
      },
      min: Number,
      max: Number
    },
    protein: {
      grams: Number,
      percentage: Number,
      perKgBodyWeight: Number
    },
    carbs: {
      grams: Number,
      percentage: Number,
      timing: {
        preworkout: Number,
        postworkout: Number,
        other: Number
      }
    },
    fats: {
      grams: Number,
      percentage: Number,
      types: {
        saturated: Number,
        unsaturated: Number,
        omega3: Number
      }
    },
    fiber: {
      min: Number,
      target: Number
    },
    water: {
      liters: Number,
      timing: [String]
    }
  },
  micronutrients: [{
    name: String,
    amount: Number,
    unit: String,
    sources: [String]
  }],
  mealPlan: {
    type: {
      type: String,
      enum: ['structured', 'flexible', 'hybrid'],
      default: 'structured'
    },
    meals: [{
      name: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack-1', 'snack-2', 'snack-3', 'pre-workout', 'post-workout']
      },
      time: String,
      options: [{
        name: String,
        ingredients: [{
          food: String,
          amount: Number,
          unit: String,
          calories: Number,
          protein: Number,
          carbs: Number,
          fats: Number,
          notes: String
        }],
        preparation: String,
        cookingTime: Number,
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fats: Number,
          fiber: Number
        },
        tags: [String]
      }],
      notes: String
    }],
    shoppingList: [{
      category: {
        type: String,
        enum: ['proteins', 'carbs', 'vegetables', 'fruits', 'fats', 'dairy', 'condiments', 'supplements']
      },
      items: [{
        name: String,
        amount: String,
        frequency: String,
        preferred_brands: [String]
      }]
    }],
    mealPrep: [{
      day: {
        type: String,
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      tasks: [{
        task: String,
        duration: Number,
        meals: [String]
      }]
    }]
  },
  supplements: [{
    name: String,
    brand: String,
    dosage: String,
    timing: [String],
    purpose: String,
    optional: {
      type: Boolean,
      default: false
    }
  }],
  guidelines: {
    eating: [String],
    hydration: [String],
    timing: {
      preworkout: {
        hours: Number,
        foods: [String]
      },
      postworkout: {
        minutes: Number,
        foods: [String]
      },
      beforeSleep: {
        hours: Number,
        avoid: [String]
      }
    },
    cheatMeals: {
      allowed: {
        type: Boolean,
        default: true
      },
      frequency: String,
      guidelines: [String]
    },
    alcohol: {
      allowed: Boolean,
      limits: String,
      guidelines: [String]
    }
  },
  tracking: {
    method: {
      type: String,
      enum: ['app', 'journal', 'photos', 'none'],
      default: 'app'
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'occasional'],
      default: 'daily'
    },
    metrics: [{
      type: String,
      enum: ['weight', 'measurements', 'photos', 'energy', 'hunger', 'mood', 'performance']
    }],
    checkIns: [{
      date: Date,
      weight: Number,
      measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        arms: Number,
        thighs: Number
      },
      photos: [{
        url: String,
        type: String
      }],
      adherence: {
        type: Number,
        min: 0,
        max: 100
      },
      notes: String,
      trainerFeedback: String
    }]
  },
  adjustments: [{
    date: Date,
    reason: String,
    changes: {
      calories: {
        old: Number,
        new: Number
      },
      macros: {
        protein: { old: Number, new: Number },
        carbs: { old: Number, new: Number },
        fats: { old: Number, new: Number }
      },
      other: [String]
    },
    madeBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  education: {
    articles: [{
      title: String,
      url: String,
      topic: String
    }],
    videos: [{
      title: String,
      url: String,
      duration: Number
    }],
    tips: [String]
  },
  recipes: [{
    name: String,
    category: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink']
    },
    prepTime: Number,
    cookTime: Number,
    servings: Number,
    ingredients: [{
      item: String,
      amount: String
    }],
    instructions: [String],
    nutrition: {
      perServing: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fats: Number,
        fiber: Number
      }
    },
    image: String,
    video: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    tags: [String]
  }],
  results: {
    startDate: Date,
    endDate: Date,
    startWeight: Number,
    endWeight: Number,
    startBodyFat: Number,
    endBodyFat: Number,
    startMeasurements: {
      chest: Number,
      waist: Number,
      hips: Number,
      arms: Number,
      thighs: Number
    },
    endMeasurements: {
      chest: Number,
      waist: Number,
      hips: Number,
      arms: Number,
      thighs: Number
    },
    achievements: [String],
    testimonial: String
  },
  duration: {
    weeks: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['private', 'trainer-only', 'public'],
    default: 'private'
  },
  templates: {
    isTemplate: {
      type: Boolean,
      default: false
    },
    templateName: String,
    usageCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
nutritionPlanSchema.index({ client: 1, status: 1 });
nutritionPlanSchema.index({ trainer: 1 });
nutritionPlanSchema.index({ booking: 1 });
nutritionPlanSchema.index({ 'templates.isTemplate': 1 });

// Calculate end date
nutritionPlanSchema.pre('save', function(next) {
  if (this.duration.weeks && this.duration.startDate && !this.duration.endDate) {
    const endDate = new Date(this.duration.startDate);
    endDate.setDate(endDate.getDate() + (this.duration.weeks * 7));
    this.duration.endDate = endDate;
  }
  
  // Calculate macro calories
  if (this.macros.protein.grams && this.macros.carbs.grams && this.macros.fats.grams) {
    const proteinCals = this.macros.protein.grams * 4;
    const carbsCals = this.macros.carbs.grams * 4;
    const fatsCals = this.macros.fats.grams * 9;
    const totalCals = proteinCals + carbsCals + fatsCals;
    
    this.macros.protein.percentage = Math.round((proteinCals / totalCals) * 100);
    this.macros.carbs.percentage = Math.round((carbsCals / totalCals) * 100);
    this.macros.fats.percentage = Math.round((fatsCals / totalCals) * 100);
  }
  
  next();
});

// Methods
nutritionPlanSchema.methods.calculateProgress = function() {
  if (!this.results.startWeight || !this.results.endWeight) {
    return null;
  }
  
  const weightChange = this.results.endWeight - this.results.startWeight;
  const bodyFatChange = this.results.endBodyFat - this.results.startBodyFat;
  
  const measurements = ['chest', 'waist', 'hips', 'arms', 'thighs'];
  const measurementChanges = {};
  
  measurements.forEach(part => {
    if (this.results.startMeasurements[part] && this.results.endMeasurements[part]) {
      measurementChanges[part] = this.results.endMeasurements[part] - this.results.startMeasurements[part];
    }
  });
  
  return {
    weightChange,
    bodyFatChange,
    measurementChanges,
    percentageWeightChange: (weightChange / this.results.startWeight) * 100,
    goalAchieved: this.goals.targetWeight 
      ? Math.abs(this.results.endWeight - this.goals.targetWeight) < 1 
      : null
  };
};

nutritionPlanSchema.methods.addCheckIn = async function(checkInData) {
  this.tracking.checkIns.push({
    date: new Date(),
    ...checkInData
  });
  
  // Update latest weight in results if provided
  if (checkInData.weight) {
    if (!this.results.startWeight) {
      this.results.startWeight = checkInData.weight;
    }
    this.results.endWeight = checkInData.weight;
  }
  
  await this.save();
  return this.tracking.checkIns[this.tracking.checkIns.length - 1];
};

nutritionPlanSchema.methods.adjustMacros = async function(newMacros, reason, userId) {
  const adjustment = {
    date: new Date(),
    reason: reason,
    changes: {
      calories: {
        old: this.macros.calories.target,
        new: newMacros.calories || this.macros.calories.target
      },
      macros: {
        protein: {
          old: this.macros.protein.grams,
          new: newMacros.protein || this.macros.protein.grams
        },
        carbs: {
          old: this.macros.carbs.grams,
          new: newMacros.carbs || this.macros.carbs.grams
        },
        fats: {
          old: this.macros.fats.grams,
          new: newMacros.fats || this.macros.fats.grams
        }
      }
    },
    madeBy: userId
  };
  
  this.adjustments.push(adjustment);
  
  // Update current macros
  if (newMacros.calories) this.macros.calories.target = newMacros.calories;
  if (newMacros.protein) this.macros.protein.grams = newMacros.protein;
  if (newMacros.carbs) this.macros.carbs.grams = newMacros.carbs;
  if (newMacros.fats) this.macros.fats.grams = newMacros.fats;
  
  await this.save();
  return adjustment;
};

nutritionPlanSchema.methods.generateShoppingList = function(days = 7) {
  const shoppingList = new Map();
  
  // Calculate quantities based on meal plan
  this.mealPlan.meals.forEach(meal => {
    meal.options.forEach(option => {
      option.ingredients.forEach(ingredient => {
        const key = ingredient.food.toLowerCase();
        if (shoppingList.has(key)) {
          const existing = shoppingList.get(key);
          existing.amount += ingredient.amount * days;
        } else {
          shoppingList.set(key, {
            name: ingredient.food,
            amount: ingredient.amount * days,
            unit: ingredient.unit
          });
        }
      });
    });
  });
  
  return Array.from(shoppingList.values());
};

nutritionPlanSchema.methods.createTemplate = async function(templateName) {
  const template = this.toObject();
  
  // Remove client-specific data
  delete template._id;
  delete template.client;
  delete template.booking;
  delete template.tracking;
  delete template.results;
  delete template.adjustments;
  
  // Mark as template
  template.templates = {
    isTemplate: true,
    templateName: templateName,
    usageCount: 0
  };
  
  template.status = 'draft';
  template.visibility = 'trainer-only';
  
  const NutritionPlan = this.constructor;
  const newTemplate = new NutritionPlan(template);
  await newTemplate.save();
  
  return newTemplate;
};

// Statics
nutritionPlanSchema.statics.createFromTemplate = async function(templateId, clientId, trainerId) {
  const template = await this.findById(templateId);
  
  if (!template || !template.templates.isTemplate) {
    throw new Error('Invalid template');
  }
  
  const planData = template.toObject();
  
  // Remove template-specific data
  delete planData._id;
  delete planData.createdAt;
  delete planData.updatedAt;
  
  // Set new client and trainer
  planData.client = clientId;
  planData.trainer = trainerId;
  planData.templates.isTemplate = false;
  planData.status = 'draft';
  
  // Update template usage count
  template.templates.usageCount += 1;
  await template.save();
  
  const newPlan = new this(planData);
  await newPlan.save();
  
  return newPlan;
};

nutritionPlanSchema.statics.getActiveClientPlans = async function(clientId) {
  return this.find({
    client: clientId,
    status: { $in: ['active', 'paused'] }
  })
  .populate('trainer', 'userId')
  .populate({
    path: 'trainer',
    populate: {
      path: 'userId',
      select: 'name profileImage'
    }
  })
  .sort({ createdAt: -1 });
};

module.exports = mongoose.model('NutritionPlan', nutritionPlanSchema);