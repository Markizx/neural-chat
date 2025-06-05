const mongoose = require('mongoose');
const Project = require('../models/project.model');

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartchat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateProjects() {
  try {
    console.log('🔧 Starting project files migration...');
    
    const projects = await Project.find({});
    console.log(`📁 Found ${projects.length} projects to check`);
    
    let migrated = 0;
    
    for (const project of projects) {
      let needsMigration = false;
      
      // Check if files field needs migration
      if (project.files && !Array.isArray(project.files)) {
        console.log(`⚠️ Project ${project._id} has invalid files field type:`, typeof project.files);
        project.files = [];
        needsMigration = true;
      } else if (project.files && project.files.length > 0) {
        // Check if any file is a string instead of object
        const hasStringFiles = project.files.some(file => typeof file === 'string');
        if (hasStringFiles) {
          console.log(`⚠️ Project ${project._id} has string-based files, converting to objects`);
          project.files = [];
          needsMigration = true;
        }
      }
      
      if (needsMigration) {
        await project.save();
        migrated++;
        console.log(`✅ Migrated project ${project._id}`);
      }
    }
    
    console.log(`🎉 Migration completed! Migrated ${migrated} projects.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProjects(); 