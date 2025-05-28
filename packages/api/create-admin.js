const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Подключаем модель пользователя
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      default: 'active'
    }
  },
  usage: {
    dailyMessages: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    }
  },
  settings: {
    theme: {
      type: String,
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Хешируем пароль перед сохранением
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neuralchat');
    console.log('✅ Подключено к MongoDB');

    // Проверяем, есть ли уже админ
    const existingAdmin = await User.findOne({ email: 'admin@neuralchat.com' });
    if (existingAdmin) {
      console.log('⚠️  Админ уже существует:', existingAdmin.email);
      process.exit(0);
    }

    // Создаем админского пользователя
    const admin = new User({
      email: 'admin@neuralchat.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      subscription: {
        plan: 'business',
        status: 'active'
      }
    });

    await admin.save();
    console.log('✅ Админский пользователь создан!');
    console.log('📧 Email: admin@neuralchat.com');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('⚠️  ВАЖНО: Смените пароль после первого входа!');

  } catch (error) {
    console.error('❌ Ошибка создания админа:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin(); 