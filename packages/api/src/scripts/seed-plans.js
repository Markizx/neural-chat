const mongoose = require('mongoose');
const Plan = require('../models/plan.model.js');
require('dotenv').config();

// Базовые планы подписок
const plans = [
  {
    name: 'Free',
    description: 'Бесплатный план для начинающих пользователей',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '50 сообщений в день',
      'Базовые AI модели',
      'Основная поддержка',
      'Экспорт в текст'
    ],
    limits: {
      messagesPerDay: 50,
      tokensPerMonth: 100000,
      modelsAccess: ['claude'],
      prioritySupport: false,
      apiAccess: false,
      customPrompts: false,
      exportFeatures: true
    },
    isActive: true,
    isPopular: false
  },
  {
    name: 'Pro',
    description: 'Профессиональный план для активных пользователей',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '1000 сообщений в день',
      'Все AI модели',
      'Приоритетная поддержка',
      'API доступ',
      'Кастомные промпты',
      'Экспорт в PDF/Word'
    ],
    limits: {
      messagesPerDay: 1000,
      tokensPerMonth: 1000000,
      modelsAccess: ['claude', 'grok', 'gpt-4'],
      prioritySupport: true,
      apiAccess: true,
      customPrompts: true,
      exportFeatures: true
    },
    isActive: true,
    isPopular: true
  },
  {
    name: 'Business',
    description: 'Корпоративный план для команд и организаций',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Неограниченные сообщения',
      'Все AI модели + бета',
      'Поддержка 24/7',
      'Полный API доступ',
      'Командная работа',
      'Аналитика и отчеты',
      'Кастомные интеграции'
    ],
    limits: {
      messagesPerDay: 999999,
      tokensPerMonth: 10000000,
      modelsAccess: ['claude', 'grok', 'gpt-4', 'gemini'],
      prioritySupport: true,
      apiAccess: true,
      customPrompts: true,
      exportFeatures: true
    },
    isActive: true,
    isPopular: false
  },
  {
    name: 'Pro Yearly',
    description: 'Профессиональный план на год со скидкой',
    price: 99.99,
    currency: 'USD',
    interval: 'year',
    features: [
      'Все возможности Pro',
      'Скидка 17%',
      '1000 сообщений в день',
      'Все AI модели',
      'Приоритетная поддержка'
    ],
    limits: {
      messagesPerDay: 1000,
      tokensPerMonth: 1000000,
      modelsAccess: ['claude', 'grok', 'gpt-4'],
      prioritySupport: true,
      apiAccess: true,
      customPrompts: true,
      exportFeatures: true
    },
    isActive: true,
    isPopular: false
  }
];

async function seedPlans() {
  try {
    // Подключение к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neuralchat');
    console.log('Connected to MongoDB');

    // Удаляем существующие планы
    await Plan.deleteMany({});
    console.log('Cleared existing plans');

    // Создаем новые планы
    const createdPlans = await Plan.insertMany(plans);
    console.log(`Created ${createdPlans.length} plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.interval}`);
    });

    console.log('\nPlans seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  seedPlans();
}

module.exports = seedPlans; 