const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

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
  files: {
    type: [fileSchema],
    default: []
  },
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
  console.log('🔍 Adding file to project:', {
    projectId: this._id,
    currentFilesType: Array.isArray(this.files) ? 'array' : typeof this.files,
    currentFilesLength: this.files ? this.files.length : 0,
    fileData: fileData
  });

  const file = {
    id: new mongoose.Types.ObjectId().toString(),
    name: fileData.name,
    url: fileData.url,
    type: fileData.type,
    size: fileData.size,
    uploadedAt: new Date()
  };

  console.log('📄 File object to add:', file);

  // Ensure files array exists
  if (!this.files) {
    this.files = [];
  }
  
  // Add file using mongoose array methods
  this.files.push(file);
  this.updateFileCount();
  
  console.log('✅ File added, new files count:', this.files.length);
  
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

// Force schema override in case of existing cached model
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;