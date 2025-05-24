const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  icon: {
    type: String,
    default: 'folder'
  },
  files: [{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    autoContext: {
      type: Boolean,
      default: true
    },
    contextLimit: {
      type: Number,
      default: 5
    }
  },
  stats: {
    chatCount: {
      type: Number,
      default: 0
    },
    fileCount: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ 'collaborators.userId': 1 });
projectSchema.index({ name: 'text', description: 'text' });

// Update file count
projectSchema.methods.updateFileCount = function() {
  this.stats.fileCount = this.files.length;
  this.stats.lastActivity = new Date();
};

// Check user permission
projectSchema.methods.checkPermission = function(userId, requiredRole = 'viewer') {
  // Owner always has permission
  if (this.userId.toString() === userId.toString()) {
    return true;
  }

  // Check collaborators
  const collaborator = this.collaborators.find(
    c => c.userId.toString() === userId.toString()
  );

  if (!collaborator) return false;

  const roleHierarchy = {
    viewer: 1,
    editor: 2,
    owner: 3
  };

  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

// Add file
projectSchema.methods.addFile = function(fileData) {
  const file = {
    id: new mongoose.Types.ObjectId().toString(),
    ...fileData,
    uploadedAt: new Date()
  };

  this.files.push(file);
  this.updateFileCount();
  
  return file;
};

// Remove file
projectSchema.methods.removeFile = function(fileId) {
  this.files = this.files.filter(f => f.id !== fileId);
  this.updateFileCount();
};

// Add collaborator
projectSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  // Check if already exists
  const existing = this.collaborators.find(
    c => c.userId.toString() === userId.toString()
  );

  if (existing) {
    existing.role = role;
  } else {
    this.collaborators.push({
      userId,
      role,
      addedAt: new Date()
    });
  }
};

// Remove collaborator
projectSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    c => c.userId.toString() !== userId.toString()
  );
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;