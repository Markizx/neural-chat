const mongoose = require('mongoose');
const Chat = require('../models/chat.model');
require('dotenv').config();

async function updateChatModels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neuralchat');
    console.log('✅ Connected to MongoDB');

    // Mapping старых моделей на новые
    const modelMapping = {
      'claude-3-5-sonnet-20241022': 'claude-4-sonnet',
      'claude-3-5-sonnet': 'claude-4-sonnet',
      'claude-3.5-sonnet': 'claude-4-sonnet'
    };

    // Найти все чаты с устаревшими моделями
    const oldModels = Object.keys(modelMapping);
    const chatsToUpdate = await Chat.find({
      model: { $in: oldModels }
    });

    console.log(`📊 Найдено чатов для обновления: ${chatsToUpdate.length}`);

    if (chatsToUpdate.length === 0) {
      console.log('✅ Все чаты уже используют актуальные модели');
      return;
    }

    // Обновляем каждый чат
    let updatedCount = 0;
    for (const chat of chatsToUpdate) {
      const oldModel = chat.model;
      const newModel = modelMapping[oldModel];
      
      if (newModel) {
        console.log(`🔄 Обновляем чат ${chat._id}: ${oldModel} → ${newModel}`);
        
        await Chat.updateOne(
          { _id: chat._id },
          { $set: { model: newModel } }
        );
        
        updatedCount++;
      }
    }

    console.log(`✅ Обновлено чатов: ${updatedCount}`);

    // Проверяем результат
    const remainingOldChats = await Chat.find({
      model: { $in: oldModels }
    });

    if (remainingOldChats.length === 0) {
      console.log('🎉 Все чаты успешно обновлены!');
    } else {
      console.log(`⚠️ Остались необновленные чаты: ${remainingOldChats.length}`);
    }

  } catch (error) {
    console.error('❌ Ошибка при обновлении моделей чатов:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Отключено от MongoDB');
  }
}

// Запускаем скрипт если он вызван напрямую
if (require.main === module) {
  updateChatModels();
}

module.exports = updateChatModels; 