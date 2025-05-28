const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Простая модель пользователя для скрипта
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  emailVerified: { type: Boolean, default: false },
  subscription: {
    plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'trialing'], default: 'active' }
  },
  usage: {
    dailyMessages: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    resetDate: { type: Date, default: Date.now }
  },
  metadata: {
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    lastActivity: Date,
    referralCode: String,
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Подключение к MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartchat';
    console.log('Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Проверяем существующих пользователей
    const existingUsers = await User.find({});
    console.log(`Found ${existingUsers.length} existing users:`);
    existingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.status}`);
    });

    // Проверяем, есть ли уже админ
    const existingAdmin = await User.findOne({ email: 'admin@neuralchat.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@neuralchat.com');
      console.log('Role:', existingAdmin.role);
      console.log('Status:', existingAdmin.status);
      
      // Обновляем роль на админа, если нужно
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('Updated role to admin');
      }
      
      process.exit(0);
    }

    // Создаем нового админа
    const adminUser = new User({
      email: 'admin@neuralchat.com',
      password: 'admin123456', // Будет захеширован автоматически
      name: 'System Administrator',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      subscription: {
        plan: 'business',
        status: 'active'
      },
      metadata: {
        loginCount: 0
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@neuralchat.com');
    console.log('🔑 Password: admin123456');
    console.log('👤 Role: admin');
    console.log('');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdmin(); 