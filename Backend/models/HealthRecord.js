const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  basicInfo: {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']
    },
    height: {
      value: Number, // cm
      lastUpdated: Date
    },
    emergencyContacts: [{
      name: String,
      relationship: String,
      phone: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }]
  },
  vitalSigns: [{
    date: {
      type: Date,
      default: Date.now
    },
    weight: Number, // kg
    bodyFat: {
      percentage: Number,
      method: {
        type: String,
        enum: ['dexa', 'bod-pod', 'calipers', 'bioimpedance', 'visual']
      }
    },
    muscleMass: Number, // kg
    bmi: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      position: {
        type: String,
        enum: ['sitting', 'standing', 'lying']
      }
    },
    heartRate: {
      resting: Number,
      recovery: {
        oneMinute: Number,
        twoMinute: Number
      }
    },
    temperature: Number, // Celsius
    oxygenSaturation: Number, // percentage
    respiratoryRate: Number, // breaths per minute
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  measurements: [{
    date: {
      type: Date,
      default: Date.now
    },
    chest: Number, // cm
    waist: Number,
    hips: Number,
    neck: Number,
    shoulders: Number,
    rightArm: Number,
    leftArm: Number,
    rightForearm: Number,
    leftForearm: Number,
    rightThigh: Number,
    leftThigh: Number,
    rightCalf: Number,
    leftCalf: Number,
    photos: [{
      url: String,
      type: {
        type: String,
        enum: ['front', 'side', 'back', 'front-flexed', 'back-flexed']
      }
    }],
    notes: String
  }],
  medicalHistory: {
    conditions: [{
      name: String,
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'managed', 'resolved']
      },
      medications: [String],
      notes: String
    }],
    surgeries: [{
      procedure: String,
      date: Date,
      hospital: String,
      recovery: String,
      complications: String
    }],
    injuries: [{
      type: String,
      bodyPart: String,
      date: Date,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'severe']
      },
      treatment: String,
      currentStatus: {
        type: String,
        enum: ['healed', 'recovering', 'chronic']
      },
      limitations: [String]
    }],
    allergies: [{
      type: {
        type: String,
        enum: ['food', 'medication', 'environmental', 'other']
      },
      allergen: String,
      reaction: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'life-threatening']
      }
    }],
    familyHistory: [{
      condition: String,
      relation: {
        type: String,
        enum: ['parent', 'sibling', 'grandparent', 'other']
      },
      notes: String
    }]
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    purpose: String,
    prescribedBy: String,
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    sideEffects: [String]
  }],
  lifestyle: {
    smoking: {
      status: {
        type: String,
        enum: ['never', 'former', 'current', 'occasional']
      },
      quitDate: Date,
      amount: String
    },
    alcohol: {
      frequency: {
        type: String,
        enum: ['never', 'rare', 'occasional', 'moderate', 'frequent', 'daily']
      },
      amount: String
    },
    sleep: {
      averageHours: Number,
      quality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent']
      },
      issues: [{
        type: String,
        enum: ['insomnia', 'sleep-apnea', 'restless-legs', 'snoring', 'other']
      }]
    },
    stress: {
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very-high']
      },
      sources: [String],
      management: [String]
    },
    diet: {
      type: {
        type: String,
        enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'other']
      },
      restrictions: [String],
      supplements: [{
        name: String,
        dosage: String,
        frequency: String,
        purpose: String
      }]
    },
    activity: {
      level: {
        type: String,
        enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extremely-active']
      },
      exerciseFrequency: {
        type: Number, // days per week
        min: 0,
        max: 7
      },
      preferredActivities: [String]
    }
  },
  fitnessAssessments: [{
    date: {
      type: Date,
      default: Date.now
    },
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer'
    },
    cardiovascular: {
      vo2max: Number,
      oneMinuteStepTest: {
        steps: Number,
        heartRate: Number
      },
      sixMinuteWalk: {
        distance: Number, // meters
        heartRate: {
          start: Number,
          end: Number
        }
      },
      cooperTest: {
        distance: Number, // meters in 12 minutes
        category: String
      }
    },
    strength: {
      oneRepMax: [{
        exercise: String,
        weight: Number
      }],
      pushups: {
        max: Number,
        form: String
      },
      pullups: {
        max: Number,
        assisted: Boolean
      },
      plank: {
        duration: Number, // seconds
        form: String
      },
      squats: {
        bodyweight: Number,
        withWeight: {
          weight: Number,
          reps: Number
        }
      }
    },
    flexibility: {
      sitAndReach: Number, // cm
      shoulderFlexibility: {
        right: String,
        left: String
      },
      hipFlexibility: String,
      ankleRange: {
        right: Number, // degrees
        left: Number
      }
    },
    balance: {
      singleLegStand: {
        right: Number, // seconds
        left: Number,
        eyesClosed: {
          right: Number,
          left: Number
        }
      },
      functionalReach: Number // cm
    },
    bodyComposition: {
      method: String,
      bodyFat: Number,
      muscleMass: Number,
      visceralFat: Number,
      metabolicAge: Number
    },
    posture: {
      assessment: String,
      deviations: [String],
      recommendations: [String]
    },
    movement: {
      squat: {
        score: Number,
        issues: [String]
      },
      lunge: {
        score: Number,
        issues: [String]
      },
      pushup: {
        score: Number,
        issues: [String]
      },
      coreStability: {
        score: Number,
        issues: [String]
      }
    },
    notes: String,
    recommendations: [String]
  }],
  labResults: [{
    date: Date,
    orderedBy: String,
    lab: String,
    tests: [{
      category: {
        type: String,
        enum: ['blood', 'urine', 'hormone', 'metabolic', 'cardiac', 'other']
      },
      name: String,
      result: String,
      unit: String,
      referenceRange: String,
      flag: {
        type: String,
        enum: ['normal', 'low', 'high', 'critical']
      }
    }],
    summary: String,
    attachments: [{
      name: String,
      url: String
    }]
  }],
  goals: [{
    type: {
      type: String,
      enum: ['weight-loss', 'muscle-gain', 'endurance', 'strength', 'flexibility', 'health', 'performance']
    },
    description: String,
    target: {
      value: Number,
      unit: String,
      date: Date
    },
    baseline: {
      value: Number,
      date: Date
    },
    progress: [{
      date: Date,
      value: Number,
      notes: String
    }],
    status: {
      type: String,
      enum: ['active', 'achieved', 'paused', 'abandoned'],
      default: 'active'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    achievedAt: Date
  }],
  wearableData: {
    devices: [{
      type: {
        type: String,
        enum: ['fitness-tracker', 'smartwatch', 'heart-rate-monitor', 'other']
      },
      brand: String,
      model: String,
      syncEnabled: {
        type: Boolean,
        default: false
      }
    }],
    lastSync: Date,
    aggregatedData: {
      steps: {
        daily: Number,
        weekly: Number,
        monthly: Number
      },
      activeMinutes: {
        daily: Number,
        weekly: Number
      },
      caloriesBurned: {
        daily: Number,
        weekly: Number
      },
      sleepData: {
        averageHours: Number,
        deepSleep: Number,
        remSleep: Number,
        lightSleep: Number
      }
    }
  },
  alerts: [{
    type: {
      type: String,
      enum: ['medical', 'medication', 'appointment', 'goal', 'measurement']
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'urgent']
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  permissions: {
    trainers: [{
      trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer'
      },
      level: {
        type: String,
        enum: ['view', 'edit', 'full'],
        default: 'view'
      },
      sections: [{
        type: String,
        enum: ['vitals', 'measurements', 'medical', 'fitness', 'labs', 'goals']
      }],
      grantedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date
    }],
    privacy: {
      shareWithTrainers: {
        type: Boolean,
        default: true
      },
      shareInProgress: {
        type: Boolean,
        default: false
      },
      anonymizeData: {
        type: Boolean,
        default: false
      }
    }
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['general', 'medical', 'fitness', 'nutrition', 'mental-health']
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Indexes
healthRecordSchema.index({ user: 1 });
healthRecordSchema.index({ 'vitalSigns.date': -1 });
healthRecordSchema.index({ 'measurements.date': -1 });
healthRecordSchema.index({ 'permissions.trainers.trainer': 1 });

// Calculate BMI on weight/height update
healthRecordSchema.pre('save', function(next) {
  const latestVital = this.vitalSigns[this.vitalSigns.length - 1];
  if (latestVital && latestVital.weight && this.basicInfo.height.value) {
    const heightInMeters = this.basicInfo.height.value / 100;
    latestVital.bmi = Math.round((latestVital.weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  next();
});

// Methods
healthRecordSchema.methods.addVitalSigns = async function(data, recordedBy) {
  const vitalEntry = {
    ...data,
    date: new Date(),
    recordedBy: recordedBy
  };
  
  // Calculate BMI if weight and height are available
  if (data.weight && this.basicInfo.height.value) {
    const heightInMeters = this.basicInfo.height.value / 100;
    vitalEntry.bmi = Math.round((data.weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  
  this.vitalSigns.push(vitalEntry);
  await this.save();
  
  // Check for alerts
  await this.checkHealthAlerts();
  
  return vitalEntry;
};

healthRecordSchema.methods.grantTrainerAccess = async function(trainerId, level = 'view', sections = [], expiresAt = null) {
  const existingAccess = this.permissions.trainers.find(
    p => p.trainer.toString() === trainerId.toString()
  );
  
  if (existingAccess) {
    existingAccess.level = level;
    existingAccess.sections = sections;
    existingAccess.expiresAt = expiresAt;
  } else {
    this.permissions.trainers.push({
      trainer: trainerId,
      level: level,
      sections: sections,
      expiresAt: expiresAt
    });
  }
  
  await this.save();
};

healthRecordSchema.methods.revokeTrainerAccess = async function(trainerId) {
  this.permissions.trainers = this.permissions.trainers.filter(
    p => p.trainer.toString() !== trainerId.toString()
  );
  await this.save();
};

healthRecordSchema.methods.checkHealthAlerts = async function() {
  const alerts = [];
  const latestVital = this.vitalSigns[this.vitalSigns.length - 1];
  
  if (latestVital) {
    // Blood pressure alerts
    if (latestVital.bloodPressure) {
      const { systolic, diastolic } = latestVital.bloodPressure;
      if (systolic >= 180 || diastolic >= 120) {
        alerts.push({
          type: 'medical',
          severity: 'urgent',
          message: 'Critical blood pressure reading detected. Seek immediate medical attention.'
        });
      } else if (systolic >= 140 || diastolic >= 90) {
        alerts.push({
          type: 'medical',
          severity: 'warning',
          message: 'High blood pressure detected. Consult with a healthcare provider.'
        });
      }
    }
    
    // Heart rate alerts
    if (latestVital.heartRate && latestVital.heartRate.resting) {
      if (latestVital.heartRate.resting > 100) {
        alerts.push({
          type: 'medical',
          severity: 'warning',
          message: 'Elevated resting heart rate detected.'
        });
      } else if (latestVital.heartRate.resting < 40) {
        alerts.push({
          type: 'medical',
          severity: 'warning',
          message: 'Low resting heart rate detected.'
        });
      }
    }
    
    // BMI alerts
    if (latestVital.bmi) {
      if (latestVital.bmi > 30) {
        alerts.push({
          type: 'medical',
          severity: 'info',
          message: 'BMI indicates obesity. Consider consulting with a healthcare provider.'
        });
      } else if (latestVital.bmi < 18.5) {
        alerts.push({
          type: 'medical',
          severity: 'info',
          message: 'BMI indicates underweight. Consider consulting with a healthcare provider.'
        });
      }
    }
  }
  
  // Add alerts to record
  if (alerts.length > 0) {
    this.alerts.push(...alerts);
    await this.save();
  }
  
  return alerts;
};

healthRecordSchema.methods.trackGoalProgress = async function(goalId, value) {
  const goal = this.goals.id(goalId);
  
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  goal.progress.push({
    date: new Date(),
    value: value
  });
  
  // Check if goal is achieved
  if (goal.target.value) {
    const achieved = goal.type.includes('loss') 
      ? value <= goal.target.value 
      : value >= goal.target.value;
    
    if (achieved && goal.status === 'active') {
      goal.status = 'achieved';
      goal.achievedAt = new Date();
    }
  }
  
  await this.save();
  return goal;
};

healthRecordSchema.methods.getHealthSummary = function() {
  const latestVital = this.vitalSigns[this.vitalSigns.length - 1];
  const latestMeasurement = this.measurements[this.measurements.length - 1];
  const activeGoals = this.goals.filter(g => g.status === 'active');
  const unacknowledgedAlerts = this.alerts.filter(a => !a.acknowledged);
  
  return {
    vitals: latestVital || null,
    measurements: latestMeasurement || null,
    activeConditions: this.medicalHistory.conditions.filter(c => c.status === 'active'),
    activeMedications: this.medications.filter(m => m.isActive),
    activeGoals: activeGoals.length,
    alerts: unacknowledgedAlerts.length,
    lastAssessment: this.fitnessAssessments.length > 0 
      ? this.fitnessAssessments[this.fitnessAssessments.length - 1].date 
      : null
  };
};

// Statics
healthRecordSchema.statics.getTrainerAccessibleRecords = async function(trainerId) {
  return this.find({
    'permissions.trainers': {
      $elemMatch: {
        trainer: trainerId,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gte: new Date() } }
        ]
      }
    }
  }).populate('user', 'name email profileImage');
};

healthRecordSchema.statics.generateHealthReport = async function(userId, dateRange) {
  const record = await this.findOne({ user: userId });
  
  if (!record) {
    throw new Error('Health record not found');
  }
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  const report = {
    user: userId,
    period: {
      start: startDate,
      end: new Date()
    },
    vitals: record.vitalSigns.filter(v => v.date >= startDate),
    measurements: record.measurements.filter(m => m.date >= startDate),
    assessments: record.fitnessAssessments.filter(a => a.date >= startDate),
    goals: record.goals.map(g => ({
      type: g.type,
      description: g.description,
      progress: g.progress.filter(p => p.date >= startDate),
      status: g.status
    })),
    alerts: record.alerts.filter(a => a.createdAt >= startDate)
  };
  
  return report;
};

module.exports = mongoose.model('HealthRecord', healthRecordSchema);