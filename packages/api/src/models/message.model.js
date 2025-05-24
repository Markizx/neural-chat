const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  model: String,
  attachments: [{
    id: String,
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['image', 'document', 'code', 'other']
    },
    size: Number,
    mimeType: String
  }],
  artifacts: [{
    id: String,
    type: {
      type: String,
      enum: ['code', 'markdown', 'react', 'svg', 'html', 'mermaid']
    },
    title: String,
    content: String,
    language: String,
    metadata: Object
  }],
  usage: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
    cost: Number
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ role: 1 });
messageSchema.index({ 'artifacts.type': 1 });

// Virtual for display content
messageSchema.virtual('displayContent').get(function() {
  if (this.isDeleted) {
    return '[Message deleted]';
  }
  return this.content;
});

// Calculate message cost
messageSchema.methods.calculateCost = function() {
  if (!this.usage || !this.usage.totalTokens) return 0;
  
  const pricing = {
    'claude-4-opus': { input: 0.015, output: 0.075 },
    'claude-4-sonnet': { input: 0.003, output: 0.015 },
    'claude-3.5-sonnet': { input: 0.003, output: 0.015 },
    'grok-3': { input: 0.01, output: 0.03 },
    'grok-2': { input: 0.005, output: 0.015 }
  };
  
  const modelPricing = pricing[this.model] || { input: 0.001, output: 0.002 };
  
  const inputCost = (this.usage.promptTokens / 1000) * modelPricing.input;
  const outputCost = (this.usage.completionTokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
};

// Add feedback
messageSchema.methods.addFeedback = function(rating, comment) {
  this.feedback = {
    rating,
    comment,
    ratedAt: new Date()
  };
};

// Soft delete
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[Deleted]';
  this.artifacts = [];
  this.attachments = [];
};

// Clean sensitive data
messageSchema.methods.toJSON = function() {
  const obj = this.toObject();
  if (this.isDeleted) {
    obj.content = '[Message deleted]';
    delete obj.artifacts;
    delete obj.attachments;
  }
  delete obj.__v;
  return obj;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;