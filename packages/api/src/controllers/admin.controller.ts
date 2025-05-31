import { Request, Response } from 'express';
import User from '../models/user.model';
import Chat from '../models/chat.model';
import Message from '../models/message.model';
import Subscription from '../models/subscription.model';
import { startOfDay, subDays, format } from 'date-fns';
import logger from '../utils/logger';
import Plan from '../models/plan.model';

// Get users with filters and pagination
export const getUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      subscription,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Subscription filter
    if (subscription && subscription !== 'all') {
      query['subscription.plan'] = subscription;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('subscription')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    // Calculate usage for each user
    const usersWithUsage = await Promise.all(
      users.map(async (user) => {
        const [messageCount, chatCount] = await Promise.all([
          Message.countDocuments({ user: user._id }),
          Chat.countDocuments({ user: user._id }),
        ]);

        const messages = await Message.find({ user: user._id })
          .select('usage')
          .lean();

        const totalTokens = messages.reduce((sum, msg) => {
          return sum + (msg.usage?.totalTokens || 0);
        }, 0);

        return {
          ...user.toObject(),
          usage: {
            totalMessages: messageCount,
            totalChats: chatCount,
            totalTokens,
          },
          lastActive: user.lastActive || user.updatedAt,
        };
      })
    );

    res.json({
      users: usersWithUsage,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
      userGrowth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ 'subscription.plan': { $in: ['pro', 'premium'] } }),
      User.countDocuments({ status: 'banned' }),
      calculateGrowth('users', 30),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
      userGrowth,
      activeGrowth: calculatePercentageChange(activeUsers, totalUsers),
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Failed to get user statistics' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete - just mark as deleted
    user.status = 'deleted';
    user.deletedAt = new Date();
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get analytics data
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { range = '7days' } = req.query;
    
    let days = 7;
    if (range === '30days') days = 30;
    if (range === '90days') days = 90;

    const startDate = subDays(new Date(), days);

    // Get various analytics data
    const [
      stats,
      userGrowth,
      messageStats,
      revenue,
      modelUsage,
      performance,
    ] = await Promise.all([
      getGeneralStats(),
      getUserGrowthData(startDate),
      getMessageStatsData(startDate),
      getRevenueData(startDate),
      getModelUsageData(),
      getPerformanceData(),
    ]);

    res.json({
      stats,
      userGrowth,
      messageStats,
      revenue,
      modelUsage,
      performance,
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
};

// Get revenue data
export const getRevenue = async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    let days = 30;
    if (period === 'week') days = 7;
    if (period === 'quarter') days = 90;
    if (period === 'year') days = 365;

    const startDate = subDays(new Date(), days);
    const revenueData = await getRevenueData(startDate);

    res.json({
      labels: revenueData.map(item => item.date),
      data: revenueData.map(item => item.revenue),
    });
  } catch (error) {
    logger.error('Error getting revenue data:', error);
    res.status(500).json({ message: 'Failed to get revenue data' });
  }
};

// Get usage data
export const getUsage = async (req: Request, res: Response) => {
  try {
    const { type = 'distribution' } = req.query;
    
    let usageData;
    
    if (type === 'distribution') {
      // Get model usage distribution
      usageData = await getModelUsageData();
    } else if (type === 'timeline') {
      // Get usage over time
      const startDate = subDays(new Date(), 30);
      usageData = await getUsageTimelineData(startDate);
    } else {
      // Default to distribution
      usageData = await getModelUsageData();
    }

    res.json(usageData);
  } catch (error) {
    logger.error('Error getting usage data:', error);
    res.status(500).json({ message: 'Failed to get usage data' });
  }
};

// Get system logs
export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      level,
      startDate,
      endDate,
    } = req.query;

    // This would typically query a logging service or database
    // For now, returning mock data
    res.json({
      logs: [],
      total: 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    logger.error('Error getting system logs:', error);
    res.status(500).json({ message: 'Failed to get system logs' });
  }
};

// Get subscriptions
export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      plan,
    } = req.query;

    const query: any = {};
    
    if (status) query.status = status;
    if (plan) query.plan = plan;

    const skip = (Number(page) - 1) * Number(limit);

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(query),
    ]);

    res.json({
      subscriptions,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    logger.error('Error getting subscriptions:', error);
    res.status(500).json({ message: 'Failed to get subscriptions' });
  }
};

// Update subscription
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Update subscription logic here
    const subscription = await Subscription.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSubscriptionStats = async (req: Request, res: Response) => {
  try {
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const canceledSubscriptions = await Subscription.countDocuments({ status: 'canceled' });
    
    // Calculate monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          currentPeriodStart: { $gte: currentMonth, $lt: nextMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        canceledSubscriptions,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        subscriptionGrowth: 5.2, // Calculate actual growth
        activeGrowth: 3.8,
        revenueGrowth: 12.5
      }
    });
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByIdAndUpdate(
      id,
      { 
        status: 'canceled',
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const extendSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const newEndDate = new Date(subscription.currentPeriodEnd);
    newEndDate.setDate(newEndDate.getDate() + days);

    subscription.currentPeriodEnd = newEndDate;
    await subscription.save();

    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    console.error('Error extending subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const refundSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Process refund logic here (integrate with payment provider)
    const refundAmount = amount || subscription.amount;
    
    // Update subscription status
    subscription.status = 'canceled';
    subscription.refundedAmount = refundAmount;
    subscription.refundedAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      data: { 
        subscription,
        refundAmount
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Plans Management
export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const planData = req.body;

    const plan = new Plan(planData);
    await plan.save();

    res.status(201).json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await Plan.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if any users have this plan
    const usersWithPlan = await User.countDocuments({ 'subscription.plan': id });
    if (usersWithPlan > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan with active subscribers'
      });
    }

    const plan = await Plan.findByIdAndDelete(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const changeUserPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { planId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Update user's subscription
    user.subscription = {
      ...user.subscription,
      plan: plan.name as 'free' | 'pro' | 'business',
      status: 'active'
    };

    await user.save();

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error changing user plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper functions
async function calculateGrowth(type: string, days: number): Promise<number> {
  const now = new Date();
  const past = subDays(now, days);
  
  let Model: any;
  switch (type) {
    case 'users':
      Model = User;
      break;
    case 'messages':
      Model = Message;
      break;
    default:
      return 0;
  }

  const [currentCount, pastCount] = await Promise.all([
    Model.countDocuments({ createdAt: { $gte: past } }),
    Model.countDocuments({ 
      createdAt: { 
        $gte: subDays(past, days),
        $lt: past
      } 
    }),
  ]);

  if (pastCount === 0) return 100;
  return Math.round(((currentCount - pastCount) / pastCount) * 100);
}

function calculatePercentageChange(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

async function getGeneralStats() {
  const [
    totalUsers,
    totalMessages,
    totalRevenue,
    avgResponseTime,
  ] = await Promise.all([
    User.countDocuments(),
    Message.countDocuments(),
    calculateTotalRevenue(),
    calculateAvgResponseTime(),
  ]);

  return {
    totalUsers,
    totalMessages,
    totalRevenue,
    avgResponseTime,
    userGrowth: await calculateGrowth('users', 7),
    messageGrowth: await calculateGrowth('messages', 7),
    revenueGrowth: 15, // Mock data
    responseTimeChange: -5, // Mock data
  };
}

async function getUserGrowthData(startDate: Date) {
  const data = [];
  const now = new Date();
  
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dayStart = startOfDay(d);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const count = await User.countDocuments({
      createdAt: { $lt: dayEnd }
    });
    
    data.push({
      date: format(d, 'yyyy-MM-dd'),
      users: count,
    });
  }
  
  return data;
}

async function getMessageStatsData(startDate: Date) {
  const data = [];
  const now = new Date();
  
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dayStart = startOfDay(d);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const count = await Message.countDocuments({
      createdAt: { $gte: dayStart, $lt: dayEnd }
    });
    
    data.push({
      date: format(d, 'yyyy-MM-dd'),
      messages: count,
    });
  }
  
  return data;
}

async function getRevenueData(startDate: Date) {
  // Mock revenue data
  const data = [];
  const now = new Date();
  
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    data.push({
      date: format(d, 'yyyy-MM-dd'),
      revenue: Math.floor(Math.random() * 1000) + 500,
    });
  }
  
  return data;
}

async function getModelUsageData() {
  const [claudeCount, grokCount] = await Promise.all([
    Message.countDocuments({ model: { $regex: /claude/i } }),
    Message.countDocuments({ model: { $regex: /grok/i } }),
  ]);
  
  const total = claudeCount + grokCount;
  
  return [
    { name: 'Claude', value: claudeCount, percentage: claudeCount / total },
    { name: 'Grok', value: grokCount, percentage: grokCount / total },
  ];
}

async function getPerformanceData() {
  // Mock performance data
  return {
    uptime: 99.9,
    avgLatency: 120,
    successRate: 98.5,
    concurrentUsers: Math.floor(Math.random() * 100) + 200,
  };
}

async function calculateTotalRevenue() {
  // Mock calculation
  return 15420;
}

async function calculateAvgResponseTime() {
  // Mock calculation
  return 1.2;
}

async function getUsageTimelineData(startDate: Date) {
  const data = [];
  const now = new Date();
  
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dayStart = startOfDay(d);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const [claudeCount, grokCount] = await Promise.all([
      Message.countDocuments({ 
        model: { $regex: /claude/i },
        createdAt: { $gte: dayStart, $lt: dayEnd }
      }),
      Message.countDocuments({ 
        model: { $regex: /grok/i },
        createdAt: { $gte: dayStart, $lt: dayEnd }
      }),
    ]);
    
    data.push({
      date: format(d, 'yyyy-MM-dd'),
      claude: claudeCount,
      grok: grokCount,
      total: claudeCount + grokCount,
    });
  }
  
  return data;
} 