const mongoose = require('mongoose');
const User = require('../models/user.model');

/**
 * Исправляет планы подписки пользователей
 * Нормализует названия планов к lowercase
 */
async function fixSubscriptionPlans() {
  try {
    console.log('🔧 Начинаем исправление планов подписки...');

    // Найти всех пользователей с планами не в lowercase
    const users = await User.find({
      'subscription.plan': { $in: ['Free', 'Pro', 'Business', 'FREE', 'PRO', 'BUSINESS'] }
    });

    console.log(`📊 Найдено ${users.length} пользователей с неправильными планами`);

    let fixed = 0;
    for (const user of users) {
      const oldPlan = user.subscription.plan;
      const newPlan = oldPlan.toLowerCase();
      
      if (oldPlan !== newPlan) {
        user.subscription.plan = newPlan;
        await user.save();
        console.log(`✅ Пользователь ${user.email}: ${oldPlan} → ${newPlan}`);
        fixed++;
      }
    }

    console.log(`🎉 Исправлено ${fixed} планов подписки`);
    return { success: true, fixed };

  } catch (error) {
    console.error('❌ Ошибка при исправлении планов:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Проверяет состояние планов подписки
 */
async function checkSubscriptionPlans() {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('📈 Статистика планов подписки:');
    stats.forEach(stat => {
      console.log(`  ${stat._id || 'undefined'}: ${stat.count} пользователей`);
    });

    return stats;
  } catch (error) {
    console.error('❌ Ошибка при проверке планов:', error);
    return [];
  }
}

module.exports = {
  fixSubscriptionPlans,
  checkSubscriptionPlans
}; 