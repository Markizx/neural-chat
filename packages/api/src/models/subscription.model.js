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
    enum: ['free', 'pro', 'business'],
    required: true
  },
  status: {
    type: String,
    required: true
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
subscriptionSchema.index({ subscriptionId: 1 });
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