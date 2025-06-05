const mongoose = require('mongoose');

const brainstormSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  participants: {
    claude: {
      model: {
        type: String,
        default: 'claude-4-sonnet'
      },
      systemPrompt: String
    },
    grok: {
      model: {
        type: String,
        default: 'grok-3'
      },
      systemPrompt: String
    }
  },
  messages: [{
    id: String,
    speaker: {
      type: String,
      enum: ['claude', 'grok', 'user'],
      required: true
    },
    content: String,
    attachments: [{
      id: String,
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['image', 'document', 'code', 'other']
      },
      size: Number,
      mimeType: String,
      data: String, // Base64 encoded file data
      isProjectFile: {
        type: Boolean,
        default: false
      },
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
      }
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    tokens: Number
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'error'],
    default: 'active'
  },
  settings: {
    turnDuration: {
      type: Number,
      default: 60, // seconds
      min: 30,
      max: 120
    },
    maxTurns: {
      type: Number,
      default: 20,
      min: 5,
      max: 50
    },
    moderationLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    format: {
      type: String,
      enum: ['debate', 'brainstorm', 'analysis', 'creative'],
      default: 'brainstorm'
    }
  },
  summary: String,
  insights: [String],
  duration: Number, // in seconds
  totalTokens: {
    type: Number,
    default: 0
  },
  completedAt: Date
}, {
  timestamps: true
});

// Indexes
brainstormSchema.index({ userId: 1, createdAt: -1 });
brainstormSchema.index({ status: 1 });
brainstormSchema.index({ topic: 'text', description: 'text' });

// Virtual for current turn
brainstormSchema.virtual('currentTurn').get(function() {
  if (!this.messages || !Array.isArray(this.messages)) {
    return 0;
  }
  // Считаем пары сообщений (Claude + Grok = 1 ход)
  const aiMessages = this.messages.filter(m => m.speaker !== 'user').length;
  return Math.floor(aiMessages / 2);
});

// Virtual for is finished
brainstormSchema.virtual('isFinished').get(function() {
  return this.status === 'completed' || 
         this.currentTurn >= (this.settings?.maxTurns || 20);
});

// Add message
brainstormSchema.methods.addMessage = function(speaker, content, attachments = [], tokens = 0) {
  // Валидируем что есть либо контент, либо файлы
  const hasContent = content && content.trim().length > 0;
  const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;
  
  if (!hasContent && !hasAttachments) {
    throw new Error('Message must have either content or attachments');
  }
  
  const message = {
    id: new mongoose.Types.ObjectId().toString(),
    speaker,
    content: content || '', // Обеспечиваем что content никогда не undefined
    attachments: attachments || [],
    timestamp: new Date(),
    tokens
  };
  
  // Ensure messages array exists
  if (!this.messages) {
    this.messages = [];
  }
  
  this.messages.push(message);
  this.totalTokens = (this.totalTokens || 0) + tokens;
  
  return message;
};

// Complete session
brainstormSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.duration = Math.floor((this.completedAt - this.createdAt) / 1000);
};

// Generate summary
brainstormSchema.methods.generateSummary = function() {
  // This would typically use AI to generate a summary
  // For now, return a basic summary
  const messages = this.messages || [];
  const claudeMessages = messages.filter(m => m.speaker === 'claude').length;
  const grokMessages = messages.filter(m => m.speaker === 'grok').length;
  
  return `Brainstorm session on "${this.topic}" completed with ${claudeMessages} Claude messages and ${grokMessages} Grok messages.`;
};

// Get next speaker
brainstormSchema.methods.getNextSpeaker = function() {
  const messages = this.messages || [];
  const lastMessage = messages[messages.length - 1];
  
  if (!lastMessage || lastMessage.speaker === 'user') {
    // Start with Claude
    return 'claude';
  }
  
  // Alternate between Claude and Grok
  return lastMessage.speaker === 'claude' ? 'grok' : 'claude';
};

// Clean data for export
brainstormSchema.methods.toExportJSON = function() {
  const obj = this.toObject();
  
  // Format messages for readability
  const messages = obj.messages || [];
  obj.messages = messages.map(msg => ({
    speaker: msg.speaker.toUpperCase(),
    content: msg.content,
    timestamp: msg.timestamp
  }));
  
  delete obj._id;
  delete obj.__v;
  delete obj.userId;
  delete obj.chatId;
  
  return obj;
};

const BrainstormSession = mongoose.model('BrainstormSession', brainstormSchema);

module.exports = BrainstormSession;