const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: function() {
      return !this.authProviders || this.authProviders.length === 0;
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  authProviders: [{
    provider: {
      type: String,
      enum: ['email', 'google', 'apple']
    },
    providerId: String,
    profile: Object
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      default: 'active'
    },
    provider: {
      type: String,
      enum: ['stripe', 'apple', 'google']
    },
    customerId: String,
    subscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean,
    trialEnd: Date
  },
  usage: {
    totalMessages: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    dailyTokens: { type: Number, default: 0 },
    dailyMessages: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    monthlyTokens: { type: Number, default: 0 }
  },
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false }
    },
    defaultModel: {
      claude: { type: String, default: 'claude-3.7-sonnet' },
      grok: { type: String, default: 'grok-3' }
    },
    // Персональные системные промпты
    systemPrompts: {
      claude: {
        type: String,
        default: '',
        maxlength: 2000
      },
      grok: {
        type: String,
        default: '',
        maxlength: 2000
      }
    },
    // Настройки ролей для ИИ
    aiRoles: {
      claude: {
        type: String,
        default: 'Assistant',
        maxlength: 50
      },
      grok: {
        type: String,
        default: 'Assistant',
        maxlength: 50
      }
    },
    // Настройки для Brainstorm
    brainstormPrompts: {
      claude: {
        type: String,
        default: '',
        maxlength: 2000
      },
      grok: {
        type: String,
        default: '',
        maxlength: 2000
      }
    },
    fontSize: {
      type: Number,
      default: 14,
      min: 12,
      max: 20
    }
  },
  devices: [{
    deviceId: String,
    platform: String,
    model: String,
    osVersion: String,
    appVersion: String,
    pushToken: String,
    lastActive: Date
  }],
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted', 'banned', 'inactive'],
    default: 'active'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  },
  metadata: {
    lastLogin: Date,
    lastActivity: Date,
    loginCount: {
      type: Number,
      default: 0
    },
    referralCode: String,
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    utm: {
      source: String,
      medium: String,
      campaign: String
    }
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
}, {
  timestamps: true
});

// Indexes
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'metadata.referralCode': 1 });

// Virtual for full URL avatar
userSchema.virtual('avatarUrl').get(function() {
  if (!this.avatar) return null;
  if (this.avatar.startsWith('http')) return this.avatar;
  return `${process.env.CDN_URL || ''}/avatars/${this.avatar}`;
});

// Check if user can send messages
userSchema.methods.canSendMessage = function() {
  const limits = {
    free: 10,
    pro: 100,
    business: Infinity
  };
  
  const limit = limits[this.subscription.plan] || 10;
  return this.usage.dailyMessages < limit;
};

// Compare password
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Reset daily usage
userSchema.methods.resetDailyUsage = function() {
  const now = new Date();
  const lastReset = this.usage.resetDate;
  
  if (!lastReset || now.toDateString() !== lastReset.toDateString()) {
    this.usage.dailyMessages = 0;
    this.usage.resetDate = now;
  }
};

// Generate referral code
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.metadata.referralCode = code;
  return code;
};

// Clean sensitive data
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  if (obj.security) {
    delete obj.security.twoFactorSecret;
    delete obj.security.passwordResetToken;
  }
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;