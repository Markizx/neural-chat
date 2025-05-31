const router = require('express').Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const chatRoutes = require('./chat.routes');
const messageRoutes = require('./message.routes');
const projectRoutes = require('./project.routes');
const brainstormRoutes = require('./brainstorm.routes');
const subscriptionRoutes = require('./subscription.routes');
const fileRoutes = require('./file.routes');
const adminRoutes = require('./admin.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/projects', projectRoutes);
router.use('/brainstorm', brainstormRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/files', fileRoutes);
router.use('/admin', adminRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'SmartChat.ai API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      user: '/api/v1/user',
      chats: '/api/v1/chats',
      messages: '/api/v1/messages',
      projects: '/api/v1/projects',
      brainstorm: '/api/v1/brainstorm',
      subscription: '/api/v1/subscription',
      files: '/api/v1/files',
      admin: '/api/v1/admin'
    }
  });
});

module.exports = router;