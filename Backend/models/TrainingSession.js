const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  sessionNumber: {
    type: Number,
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  datetime: {
    scheduled: {
      date: Date,
      startTime: String,
      endTime: String
    },
    actual: {
      startTime: Date,
      endTime: Date,
      duration: Number // in minutes
    }
  },
  location: {
    type: {
      type: String,
      enum: ['gym', 'home', 'outdoor', 'online']
    },
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    notes: String
  },
  focus: {
    primaryGoal: {
      type: String,
      enum: [
        'weight-loss',
        'muscle-building',
        'strength',
        'endurance',
        'flexibility',
        'balance',
        'sport-specific',
        'rehabilitation',
        'general-fitness'
      ]
    },
    bodyParts: [{
      type: String,
      enum: [
        'chest',
        'back',
        'shoulders',
        'arms',
        'core',
        'legs',
        'glutes',
        'full-body'
      ]
    }]
  },
  warmup: {
    exercises: [{
      name: String,
      duration: Number, // seconds
      sets: Number,
      notes: String
    }],
    totalDuration: Number // minutes
  },
  mainWorkout: {
    exercises: [{
      exercise: {
        name: {
          type: String,
          required: true
        },
        category: {
          type: String,
          enum: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'functional']
        },
        equipment: [String],
        muscleGroups: [String]
      },
      plannedSets: Number,
      actualSets: [{
        reps: Number,
        weight: Number, // kg
        distance: Number, // meters
        duration: Number, // seconds
        restAfter: Number, // seconds
        intensity: {
          type: String,
          enum: ['light', 'moderate', 'hard', 'maximum']
        },
        notes: String,
        completed: {
          type: Boolean,
          default: true
        }
      }],
      techniqueNotes: String,
      formRating: {
        type: Number,
        min: 1,
        max: 5
      },
      clientFeedback: {
        difficulty: {
          type: Number,
          min: 1,
          max: 10
        },
        notes: String
      }
    }],
    circuitDetails: {
      isCircuit: {
        type: Boolean,
        default: false
      },
      rounds: Number,
      restBetweenRounds: Number // seconds
    }
  },
  cooldown: {
    exercises: [{
      name: String,
      duration: Number, // seconds
      type: {
        type: String,
        enum: ['static-stretch', 'dynamic-stretch', 'foam-rolling', 'breathing']
      },
      notes: String
    }],
    totalDuration: Number // minutes
  },
  cardioData: {
    activities: [{
      type: {
        type: String,
        enum: ['running', 'cycling', 'rowing', 'elliptical', 'swimming', 'other']
      },
      duration: Number, // minutes
      distance: Number, // km
      avgSpeed: Number, // km/h
      avgHeartRate: Number,
      maxHeartRate: Number,
      caloriesBurned: Number,
      intervals: [{
        duration: Number, // seconds
        intensity: String,
        speed: Number,
        incline: Number
      }]
    }]
  },
  measurements: {
    preSession: {
      weight: Number, // kg
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      },
      heartRate: Number,
      bodyTemp: Number,
      hydrationLevel: {
        type: String,
        enum: ['well-hydrated', 'normal', 'dehydrated']
      },
      energyLevel: {
        type: Number,
        min: 1,
        max: 10
      },
      sleepQuality: {
        hours: Number,
        quality: {
          type: Number,
          min: 1,
          max: 10
        }
      }
    },
    postSession: {
      heartRate: Number,
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      },
      perceivedExertion: {
        type: Number,
        min: 1,
        max: 10
      }
    },
    progressPhotos: [{
      url: String,
      type: {
        type: String,
        enum: ['front', 'side', 'back', 'specific']
      },
      notes: String
    }]
  },
  performance: {
    personalRecords: [{
      exercise: String,
      metric: {
        type: String,
        enum: ['weight', 'reps', 'time', 'distance']
      },
      value: Number,
      previousBest: Number,
      improvement: Number // percentage
    }],
    goalsAchieved: [String],
    overallRating: {
      trainer: {
        type: Number,
        min: 1,
        max: 5
      },
      client: {
        type: Number,
        min: 1,
        max: 5
      }
    }
  },
  nutrition: {
    preWorkout: {
      meal: String,
      time: String, // how long before workout
      hydration: Number // ml
    },
    duringWorkout: {
      hydration: Number, // ml
      supplements: [String]
    },
    postWorkout: {
      meal: String,
      time: String, // how long after workout
      supplements: [String]
    },
    dailyCalories: Number,
    macros: {
      protein: Number, // grams
      carbs: Number,
      fats: Number
    }
  },
  homework: {
    exercises: [{
      name: String,
      sets: Number,
      reps: String,
      frequency: String, // e.g., "3 times per week"
      videoUrl: String,
      notes: String
    }],
    nutritionGoals: [String],
    lifestyleGoals: [String],
    nextSessionPrep: String
  },
  notes: {
    trainer: {
      observations: String,
      recommendations: String,
      concerns: String,
      privateNotes: String // Not visible to client
    },
    client: {
      feedback: String,
      concerns: String,
      requests: String
    }
  },
  modifications: [{
    exercise: String,
    reason: {
      type: String,
      enum: ['injury', 'difficulty', 'equipment', 'preference', 'form-issue']
    },
    modification: String
  }],
  injuries: [{
    bodyPart: String,
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe']
    },
    treatment: String,
    affectedExercises: [String]
  }],
  equipment: {
    used: [{
      name: String,
      weight: String,
      settings: String
    }],
    unavailable: [String]
  },
  environment: {
    temperature: Number,
    humidity: Number,
    conditions: {
      type: String,
      enum: ['indoor', 'outdoor-sunny', 'outdoor-cloudy', 'outdoor-rainy']
    }
  },
  summary: {
    totalExercises: Number,
    totalSets: Number,
    totalReps: Number,
    totalWeight: Number, // kg lifted
    totalDistance: Number, // km
    totalDuration: Number, // minutes
    caloriesBurned: Number,
    intensityDistribution: {
      light: Number, // percentage
      moderate: Number,
      hard: Number,
      maximum: Number
    }
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    reason: String,
    scheduledDate: Date,
    completed: {
      type: Boolean,
      default: false
    }
  },
  attachments: [{
    type: {
      type: String,
      enum: ['video', 'image', 'document']
    },
    url: String,
    name: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  billing: {
    isPaid: {
      type: Boolean,
      default: false
    },
    amount: Number,
    paidAt: Date
  }
}, {
  timestamps: true
});

// Indexes
trainingSessionSchema.index({ booking: 1, sessionNumber: 1 });
trainingSessionSchema.index({ trainer: 1, 'datetime.scheduled.date': -1 });
trainingSessionSchema.index({ client: 1, 'datetime.scheduled.date': -1 });
trainingSessionSchema.index({ status: 1 });
trainingSessionSchema.index({ 'datetime.actual.startTime': -1 });

// Calculate summary before save
trainingSessionSchema.pre('save', function(next) {
  if (this.isModified('mainWorkout') || this.isModified('cardioData')) {
    // Calculate totals
    let totalSets = 0;
    let totalReps = 0;
    let totalWeight = 0;
    
    this.mainWorkout.exercises.forEach(exercise => {
      exercise.actualSets.forEach(set => {
        if (set.completed) {
          totalSets += 1;
          totalReps += set.reps || 0;
          totalWeight += (set.weight || 0) * (set.reps || 0);
        }
      });
    });
    
    this.summary.totalExercises = this.mainWorkout.exercises.length;
    this.summary.totalSets = totalSets;
    this.summary.totalReps = totalReps;
    this.summary.totalWeight = totalWeight;
    
    // Calculate total distance from cardio
    this.summary.totalDistance = this.cardioData.activities.reduce(
      (total, activity) => total + (activity.distance || 0), 0
    );
    
    // Calculate duration
    if (this.datetime.actual.startTime && this.datetime.actual.endTime) {
      this.datetime.actual.duration = Math.round(
        (this.datetime.actual.endTime - this.datetime.actual.startTime) / (60 * 1000)
      );
      this.summary.totalDuration = this.datetime.actual.duration;
    }
  }
  
  next();
});

// Methods
trainingSessionSchema.methods.startSession = async function() {
  this.status = 'in-progress';
  this.datetime.actual.startTime = new Date();
  await this.save();
};

trainingSessionSchema.methods.endSession = async function() {
  this.status = 'completed';
  this.datetime.actual.endTime = new Date();
  
  if (this.datetime.actual.startTime) {
    this.datetime.actual.duration = Math.round(
      (this.datetime.actual.endTime - this.datetime.actual.startTime) / (60 * 1000)
    );
  }
  
  await this.save();
};

trainingSessionSchema.methods.addExerciseSet = async function(exerciseIndex, setData) {
  if (this.mainWorkout.exercises[exerciseIndex]) {
    this.mainWorkout.exercises[exerciseIndex].actualSets.push(setData);
    await this.save();
    return this.mainWorkout.exercises[exerciseIndex];
  }
  throw new Error('Exercise not found');
};

trainingSessionSchema.methods.recordPersonalRecord = async function(exercise, metric, value) {
  // Find previous best
  const previousRecords = await this.constructor.find({
    client: this.client,
    status: 'completed',
    'performance.personalRecords.exercise': exercise,
    'performance.personalRecords.metric': metric
  }).sort({ 'performance.personalRecords.value': -1 }).limit(1);
  
  const previousBest = previousRecords.length > 0 
    ? previousRecords[0].performance.personalRecords.find(pr => pr.exercise === exercise).value
    : 0;
  
  if (value > previousBest) {
    this.performance.personalRecords.push({
      exercise,
      metric,
      value,
      previousBest,
      improvement: previousBest > 0 ? ((value - previousBest) / previousBest) * 100 : 100
    });
    
    await this.save();
    return true;
  }
  
  return false;
};

trainingSessionSchema.methods.generateReport = function() {
  return {
    session: {
      date: this.datetime.scheduled.date,
      duration: this.datetime.actual.duration || 0,
      status: this.status
    },
    performance: {
      totalExercises: this.summary.totalExercises,
      totalSets: this.summary.totalSets,
      totalReps: this.summary.totalReps,
      totalWeight: this.summary.totalWeight,
      totalDistance: this.summary.totalDistance,
      personalRecords: this.performance.personalRecords,
      ratings: this.performance.overallRating
    },
    focus: this.focus,
    notes: {
      trainer: this.notes.trainer.observations,
      client: this.notes.client.feedback
    },
    homework: this.homework,
    nextSteps: this.notes.trainer.recommendations
  };
};

// Statics
trainingSessionSchema.statics.getClientProgress = async function(clientId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  const sessions = await this.find({
    client: clientId,
    status: 'completed',
    'datetime.actual.startTime': { $gte: startDate }
  }).sort({ 'datetime.actual.startTime': 1 });
  
  const progress = {
    totalSessions: sessions.length,
    totalDuration: sessions.reduce((sum, s) => sum + (s.summary.totalDuration || 0), 0),
    totalWeight: sessions.reduce((sum, s) => sum + (s.summary.totalWeight || 0), 0),
    totalDistance: sessions.reduce((sum, s) => sum + (s.summary.totalDistance || 0), 0),
    personalRecords: [],
    averageIntensity: 0,
    trends: {
      weight: [],
      performance: []
    }
  };
  
  // Collect all PRs
  sessions.forEach(session => {
    progress.personalRecords.push(...session.performance.personalRecords);
    
    // Track weight trend
    if (session.measurements.preSession.weight) {
      progress.trends.weight.push({
        date: session.datetime.actual.startTime,
        value: session.measurements.preSession.weight
      });
    }
    
    // Track performance trend
    if (session.performance.overallRating.client) {
      progress.trends.performance.push({
        date: session.datetime.actual.startTime,
        value: session.performance.overallRating.client
      });
    }
  });
  
  return progress;
};

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);