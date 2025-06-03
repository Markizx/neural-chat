const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const Subscription = require('../models/subscription.model');
const { startOfDay, subDays, format } = require('date-fns');
const logger = require('../utils/logger');

// Get users with filters and pagination
exports.getUsers = async (req, res) => {
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

    const query = {};

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
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

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
exports.getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ 'subscription.plan': { $in: ['pro', 'premium'] } }),
      User.countDocuments({ status: 'banned' }),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
      userGrowth: 0, // TODO: calculate growth
      activeGrowth: Math.round((activeUsers / totalUsers) * 100),
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Failed to get user statistics' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates._id;

    // Handle subscription updates separately
    const subscriptionUpdates = {};
    if (updates.subscriptionPlan) {
      subscriptionUpdates['subscription.plan'] = updates.subscriptionPlan;
      delete updates.subscriptionPlan;
    }
    if (updates.subscriptionStatus) {
      subscriptionUpdates['subscription.status'] = updates.subscriptionStatus;
      delete updates.subscriptionStatus;
    }

    // Combine all updates
    const allUpdates = { ...updates, ...subscriptionUpdates };

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allUpdates },
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
exports.deleteUser = async (req, res) => {
  try {
    const { id: userId } = req.params;

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

// Export users to CSV
exports.exportUsers = async (req, res) => {
  try {
    const users = await User.find({ status: { $ne: 'deleted' } })
      .select('-password')
      .populate('subscription')
      .sort({ createdAt: -1 });

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
          id: user._id,
          name: user.name || '',
          email: user.email,
          status: user.status,
          role: user.role || 'user',
          plan: user.subscription?.plan || 'free',
          subscriptionStatus: user.subscription?.status || 'inactive',
          totalMessages: messageCount,
          totalChats: chatCount,
          totalTokens,
          createdAt: format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          lastActive: format(new Date(user.lastActive || user.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
        };
      })
    );

    // Generate CSV
    const headers = [
      'ID',
      'Name',
      'Email',
      'Status',
      'Role',
      'Plan',
      'Subscription Status',
      'Total Messages',
      'Total Chats',
      'Total Tokens',
      'Created At',
      'Last Active'
    ];

    const csvRows = [
      headers.join(','),
      ...usersWithUsage.map(user => [
        user.id,
        `"${user.name}"`,
        user.email,
        user.status,
        user.role,
        user.plan,
        user.subscriptionStatus,
        user.totalMessages,
        user.totalChats,
        user.totalTokens,
        user.createdAt,
        user.lastActive
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting users:', error);
    res.status(500).json({ message: 'Failed to export users' });
  }
}; 