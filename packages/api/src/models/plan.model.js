const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
  },
  interval: {
    type: String,
    required: true,
    enum: ['month', 'year'],
    default: 'month',
  },
  features: [{
    type: String,
    trim: true,
  }],
  limits: {
    messagesPerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    tokensPerMonth: {
      type: Number,
      required: true,
      min: 0,
    },
    modelsAccess: [{
      type: String,
      enum: ['claude', 'grok', 'gpt-4', 'gemini'],
    }],
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    apiAccess: {
      type: Boolean,
      default: false,
    },
    customPrompts: {
      type: Boolean,
      default: false,
    },
    exportFeatures: {
      type: Boolean,
      default: false,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  stripePriceId: {
    type: String,
    sparse: true,
  },
}, {
  timestamps: true,
});

// Indexes
planSchema.index({ name: 1 });
planSchema.index({ price: 1 });
planSchema.index({ isActive: 1 });

// Ensure only one plan can be marked as popular at a time
planSchema.pre('save', async function(next) {
  if (this.isPopular && this.isModified('isPopular')) {
    await mongoose.model('Plan').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isPopular: false } }
    );
  }
  next();
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan; 