const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['web', 'ios', 'android'],
    required: true
  },
  provider: {
    type: String,
    enum: ['stripe', 'apple', 'google'],
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'premium', 'business'],
    required: true
  },
  status: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  priceId: String,
  productId: String,
  customerId: String,
  subscriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  originalTransactionId: String, // для mobile
  latestReceiptData: String, // для Apple
  purchaseToken: String, // для Google
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  canceledAt: Date,
  cancelReason: String,
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundedAt: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  metadata: Object,
  history: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: Object
  }]
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ userId: 1, platform: 1 });
subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ status: 1 });

// Add history entry
subscriptionSchema.methods.addHistoryEntry = function(action, details = {}) {
  this.history.push({
    action,
    timestamp: new Date(),
    details
  });
};

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return ['active', 'trialing'].includes(this.status) &&
         (!this.currentPeriodEnd || this.currentPeriodEnd > new Date());
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;