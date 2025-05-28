const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Простая модель пользователя для скрипта
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function resetPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'newpassword123';

    if (!email) {
      console.log('Usage: node reset-password.js <email> [new-password]');
      console.log('Example: node reset-password.js admin@neuralchat.com admin123456');
      process.exit(1);
    }

    // Подключение к MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartchat';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Найти пользователя
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email}) - Role: ${user.role}`);

    // Хешировать новый пароль
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Обновить пароль
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password updated successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log('👤 Role:', user.role);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

resetPassword(); 