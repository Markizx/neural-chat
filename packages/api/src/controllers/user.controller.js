const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const Project = require('../models/project.model');
const storageService = require('../services/storage.service');
const stripeService = require('../services/stripe.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -security.twoFactorSecret')
      .populate('metadata.referredBy', 'name email');

    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    res.json(apiResponse(true, { user }));
  } catch (error) {
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { name } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -security.twoFactorSecret');

    res.json(apiResponse(true, { user }));
  } catch (error) {
    next(error);
  }
};

// Delete profile
exports.deleteProfile = async (req, res, next) => {
  try {
    const { password, confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'INVALID_CONFIRMATION',
        message: 'Please type DELETE to confirm account deletion'
      }));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_PASSWORD',
        message: 'Invalid password'
      }));
    }

    // Cancel subscription if exists
    if (user.subscription.subscriptionId) {
      await stripeService.cancelSubscription(user.subscription.subscriptionId);
    }

    // Delete user data
    await Chat.deleteMany({ userId: user._id });
    await Message.deleteMany({ userId: user._id });
    await Project.deleteMany({ userId: user._id });

    // Soft delete user
    user.status = 'deleted';
    user.email = `deleted_${user._id}@deleted.com`;
    user.name = 'Deleted User';
    user.avatar = null;
    await user.save();

    res.json(apiResponse(true, { message: 'Account deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

// Update avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_FILE',
        message: 'No avatar file uploaded'
      }));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Delete old avatar if exists
    if (user.avatar && !user.avatar.startsWith('http')) {
      await storageService.deleteFile(user.avatar);
    }

    // Update avatar
    user.avatar = req.file.location || req.file.path;
    await user.save();

    res.json(apiResponse(true, {
      user: user.toJSON(),
      message: 'Avatar updated successfully'
    }));
  } catch (error) {
    next(error);
  }
};

// Get user settings
exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('settings');

    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    res.json(apiResponse(true, user.settings));
  } catch (error) {
    next(error);
  }
};

// Update settings
exports.updateSettings = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const updates = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Обновляем только переданные настройки
    if (updates.theme !== undefined) {
      user.settings.theme = updates.theme;
    }
    
    if (updates.language !== undefined) {
      user.settings.language = updates.language;
    }
    
    if (updates.notifications !== undefined) {
      user.settings.notifications = {
        ...user.settings.notifications,
        ...updates.notifications
      };
    }
    
    if (updates.defaultModel !== undefined) {
      user.settings.defaultModel = {
        ...user.settings.defaultModel,
        ...updates.defaultModel
      };
    }
    
    if (updates.systemPrompts !== undefined) {
      user.settings.systemPrompts = {
        ...user.settings.systemPrompts,
        ...updates.systemPrompts
      };
    }
    
    if (updates.aiRoles !== undefined) {
      user.settings.aiRoles = {
        ...user.settings.aiRoles,
        ...updates.aiRoles
      };
    }
    
    if (updates.brainstormPrompts !== undefined) {
      user.settings.brainstormPrompts = {
        ...user.settings.brainstormPrompts,
        ...updates.brainstormPrompts
      };
    }

    await user.save();

    res.json(apiResponse(true, user.settings));
  } catch (error) {
    next(error);
  }
};

// Get usage stats
exports.getUsage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Get additional stats
    const [totalChats, totalMessages] = await Promise.all([
      Chat.countDocuments({ userId: user._id }),
      Message.countDocuments({ userId: user._id })
    ]);

    const usage = {
      daily: {
        messages: user.usage.dailyMessages,
        limit: user.subscription.plan === 'free' ? 10 : 
               user.subscription.plan === 'pro' ? 100 : Infinity,
        resetAt: user.usage.resetDate
      },
      total: {
        messages: user.usage.totalMessages,
        tokens: user.usage.totalTokens,
        chats: totalChats,
        messagesInDb: totalMessages
      },
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status
      }
    };

    res.json(apiResponse(true, { usage }));
  } catch (error) {
    next(error);
  }
};

// Get subscription info
exports.getSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    let subscriptionDetails = null;
    if (user.subscription.subscriptionId) {
      subscriptionDetails = await stripeService.getSubscription(
        user.subscription.subscriptionId
      );
    }

    res.json(apiResponse(true, {
      subscription: user.subscription,
      details: subscriptionDetails
    }));
  } catch (error) {
    next(error);
  }
};

// Get invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    if (!user.subscription.customerId) {
      return res.json(apiResponse(true, { invoices: [] }));
    }

    const invoices = await stripeService.getInvoices(
      user.subscription.customerId
    );

    res.json(apiResponse(true, { invoices }));
  } catch (error) {
    next(error);
  }
};

// Export user data
exports.exportData = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -security');

    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Gather all user data
    const [chats, messages, projects] = await Promise.all([
      Chat.find({ userId: user._id }),
      Message.find({ userId: user._id }),
      Project.find({ userId: user._id })
    ]);

    const exportData = {
      user: user.toJSON(),
      chats: chats.map(c => c.toJSON()),
      messages: messages.map(m => m.toJSON()),
      projects: projects.map(p => p.toJSON()),
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="smartchat-export-${user._id}-${Date.now()}.json"`
    );

    res.json(exportData);
  } catch (error) {
    next(error);
  }
};

// Get user projects
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user._id })
      .select('name description filesCount createdAt updatedAt')
      .sort('-updatedAt');

    res.json(apiResponse(true, { projects }));
  } catch (error) {
    next(error);
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    // TODO: Implement file upload logic
    res.json(apiResponse(true, { message: 'Avatar upload not implemented yet' }));
  } catch (error) {
    next(error);
  }
};

// Delete avatar
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    user.avatar = null;
    await user.save();

    res.json(apiResponse(true, { message: 'Avatar deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect'
      }));
    }

    user.password = newPassword;
    await user.save();

    res.json(apiResponse(true, { message: 'Password updated successfully' }));
  } catch (error) {
    next(error);
  }
};

// Enable 2FA
exports.enable2FA = async (req, res, next) => {
  try {
    // TODO: Implement 2FA logic
    res.json(apiResponse(true, { message: '2FA not implemented yet' }));
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
exports.disable2FA = async (req, res, next) => {
  try {
    // TODO: Implement 2FA logic
    res.json(apiResponse(true, { message: '2FA not implemented yet' }));
  } catch (error) {
    next(error);
  }
};

// Verify 2FA
exports.verify2FA = async (req, res, next) => {
  try {
    // TODO: Implement 2FA logic
    res.json(apiResponse(true, { message: '2FA not implemented yet' }));
  } catch (error) {
    next(error);
  }
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { password, confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'INVALID_CONFIRMATION',
        message: 'Please type DELETE to confirm'
      }));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_PASSWORD',
        message: 'Invalid password'
      }));
    }

    // Delete all user data
    await Promise.all([
      Chat.deleteMany({ userId: user._id }),
      Message.deleteMany({ userId: user._id }),
      Project.deleteMany({ userId: user._id })
    ]);

    await user.deleteOne();

    res.json(apiResponse(true, { message: 'Account deleted successfully' }));
  } catch (error) {
    next(error);
  }
};