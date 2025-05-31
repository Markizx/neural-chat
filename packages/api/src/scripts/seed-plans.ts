import mongoose from 'mongoose';
import Plan from '../models/plan.model';

const defaultPlans = [
  {
    name: 'Free',
    description: 'Perfect for getting started with AI conversations',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Basic AI conversations',
      'Claude access',
      'Standard response time',
      'Community support'
    ],
    limits: {
      messagesPerDay: 10,
      tokensPerMonth: 10000,
      modelsAccess: ['claude'],
      prioritySupport: false,
      apiAccess: false,
      customPrompts: false,
      exportFeatures: false,
    },
    isActive: true,
    isPopular: false,
  },
  {
    name: 'Pro',
    description: 'Enhanced features for power users',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited conversations',
      'Claude & Grok access',
      'Priority response time',
      'Custom prompts',
      'Export conversations',
      'Email support'
    ],
    limits: {
      messagesPerDay: 1000,
      tokensPerMonth: 100000,
      modelsAccess: ['claude', 'grok'],
      prioritySupport: false,
      apiAccess: false,
      customPrompts: true,
      exportFeatures: true,
    },
    isActive: true,
    isPopular: true,
  },
  {
    name: 'Premium',
    description: 'Advanced AI capabilities for professionals',
    price: 49.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Pro',
      'All AI models access',
      'Priority support',
      'API access',
      'Advanced analytics',
      'Team collaboration',
      'Custom integrations'
    ],
    limits: {
      messagesPerDay: 5000,
      tokensPerMonth: 500000,
      modelsAccess: ['claude', 'grok', 'gpt-4', 'gemini'],
      prioritySupport: true,
      apiAccess: true,
      customPrompts: true,
      exportFeatures: true,
    },
    isActive: true,
    isPopular: false,
  },
  {
    name: 'Business',
    description: 'Enterprise-grade solution for teams',
    price: 199.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Premium',
      'Unlimited usage',
      'Dedicated support',
      'Custom deployment',
      'SLA guarantee',
      'Advanced security',
      'Custom training'
    ],
    limits: {
      messagesPerDay: -1, // Unlimited
      tokensPerMonth: -1, // Unlimited
      modelsAccess: ['claude', 'grok', 'gpt-4', 'gemini'],
      prioritySupport: true,
      apiAccess: true,
      customPrompts: true,
      exportFeatures: true,
    },
    isActive: true,
    isPopular: false,
  },
];

async function seedPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neuralchat');
    console.log('Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    console.log('Cleared existing plans');

    // Insert default plans
    const createdPlans = await Plan.insertMany(defaultPlans);
    console.log(`Created ${createdPlans.length} plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.interval}`);
    });

    console.log('Plans seeded successfully!');
  } catch (error) {
    console.error('Error seeding plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedPlans();
}

export default seedPlans; 