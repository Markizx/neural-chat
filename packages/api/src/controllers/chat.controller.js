const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const Project = require('../models/project.model');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Get all chats
exports.getChats = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      projectId,
      isArchived = false,
      search
    } = req.query;

    const query = {
      userId: req.user._id,
      isArchived: isArchived === 'true'
    };

    if (type) {
      query.type = type;
    }

    if (projectId) {
      query.projectId = projectId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { isPinned: -1, updatedAt: -1 },
      populate: 'projectId'
    };

    const chats = await Chat.find(query)
      .populate('projectId', 'name color')
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Chat.countDocuments(query);

    res.json(apiResponse(true, {
      chats,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        hasNext: options.page * options.limit < total
      }
    }));
  } catch (error) {
    next(error);
  }
};

// Create chat
exports.createChat = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { type, model, title, projectId } = req.body;

    const chat = new Chat({
      userId: req.user._id,
      type,
      model,
      title: title || `New ${type} Chat`,
      projectId
    });

    await chat.save();
    
    // Populate project info
    await chat.populate('projectId', 'name color');

    res.status(201).json(apiResponse(true, { chat }));
  } catch (error) {
    next(error);
  }
};

// Get chat by ID
exports.getChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findOne({
      _id: id,
      userId: req.user._id
    }).populate('projectId');

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    res.json(apiResponse(true, { chat }));
  } catch (error) {
    next(error);
  }
};

// Update chat
exports.updateChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, tags, projectId } = req.body;

    const chat = await Chat.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    // Update fields
    if (title !== undefined) chat.title = title;
    if (tags !== undefined) chat.tags = tags;
    if (projectId !== undefined) chat.projectId = projectId;

    await chat.save();
    await chat.populate('projectId', 'name color');

    res.json(apiResponse(true, { chat }));
  } catch (error) {
    next(error);
  }
};

// Delete chat
exports.deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    // Delete all messages
    await Message.deleteMany({ chatId: id });

    // Delete chat
    await chat.deleteOne();

    res.json(apiResponse(true, { message: 'Chat deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

// Archive/Unarchive chat
exports.archiveChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { archive = true } = req.body;

    const chat = await Chat.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    chat.isArchived = archive;
    await chat.save();

    res.json(apiResponse(true, {
      chat,
      message: archive ? 'Chat archived' : 'Chat unarchived'
    }));
  } catch (error) {
    next(error);
  }
};

// Pin/Unpin chat
exports.pinChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pin = true } = req.body;

    const chat = await Chat.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    chat.isPinned = pin;
    await chat.save();

    res.json(apiResponse(true, {
      chat,
      message: pin ? 'Chat pinned' : 'Chat unpinned'
    }));
  } catch (error) {
    next(error);
  }
};

// Share chat
exports.shareChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPublic = true } = req.body;

    const chat = await Chat.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    if (isPublic && !chat.sharing.shareId) {
      chat.generateShareId();
    }

    chat.sharing.isPublic = isPublic;
    await chat.save();

    const shareUrl = isPublic
      ? `${process.env.FRONTEND_URL}/shared/${chat.sharing.shareId}`
      : null;

    res.json(apiResponse(true, {
      chat,
      shareUrl,
      message: isPublic ? 'Chat shared' : 'Chat unshared'
    }));
  } catch (error) {
    next(error);
  }
};

// Get shared chat
exports.getSharedChat = async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const chat = await Chat.findOne({
      'sharing.shareId': shareId,
      'sharing.isPublic': true
    }).populate('userId', 'name avatar');

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Shared chat not found'
      }));
    }

    // Get messages
    const messages = await Message.find({
      chatId: chat._id,
      isDeleted: false
    }).sort({ createdAt: 1 });

    res.json(apiResponse(true, {
      chat: chat.toPublicJSON(),
      messages,
      owner: {
        name: chat.userId.name,
        avatar: chat.userId.avatarUrl
      }
    }));
  } catch (error) {
    next(error);
  }
};

// Search chats
exports.searchChats = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'MISSING_QUERY',
        message: 'Search query is required'
      }));
    }

    // Search in messages
    const messageMatches = await Message.find({
      userId: req.user._id,
      content: { $regex: q, $options: 'i' },
      isDeleted: false
    }).distinct('chatId');

    // Search in chats
    const query = {
      $and: [
        { userId: req.user._id },
        {
          $or: [
            { _id: { $in: messageMatches } },
            { title: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } }
          ]
        }
      ]
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { updatedAt: -1 }
    };

    const chats = await Chat.find(query)
      .populate('projectId', 'name color')
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Chat.countDocuments(query);

    res.json(apiResponse(true, {
      chats,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        hasNext: options.page * options.limit < total
      }
    }));
  } catch (error) {
    next(error);
  }
};