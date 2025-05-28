const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'New Chat'
  },
  type: {
    type: String,
    enum: ['claude', 'grok', 'brainstorm'],
    required: true
  },
  model: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  sharing: {
    isPublic: {
      type: Boolean,
      default: false
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true
    },
    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  metadata: {
    messageCount: {
      type: Number,
      default: 0
    },
    lastMessageAt: Date,
    totalTokens: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, isPinned: 1 });
chatSchema.index({ userId: 1, isArchived: 1 });
chatSchema.index({ tags: 1 });
chatSchema.index({ projectId: 1 });

// Generate share ID
chatSchema.methods.generateShareId = function() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let shareId = '';
  for (let i = 0; i < 10; i++) {
    shareId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.sharing.shareId = shareId;
  return shareId;
};

// Virtual for display title
chatSchema.virtual('displayTitle').get(function() {
  if (this.title && this.title !== 'New Chat') {
    return this.title;
  }
  
  // Generate title based on type and date
  const date = new Date(this.createdAt).toLocaleDateString();
  const typeLabel = {
    claude: 'Claude Chat',
    grok: 'Grok Chat',
    brainstorm: 'Brainstorm Session'
  };
  
  return `${typeLabel[this.type]} - ${date}`;
});

// Update metadata
chatSchema.methods.updateMetadata = function(tokens = 0) {
  this.metadata.messageCount += 1;
  this.metadata.lastMessageAt = new Date();
  this.metadata.totalTokens += tokens;
};

// Clean data for public sharing
chatSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.userId;
  delete obj.sharing.sharedWith;
  delete obj.__v;
  return obj;
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;