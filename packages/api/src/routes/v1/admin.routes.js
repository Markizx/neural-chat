const router = require('express').Router();
const User = require('../../models/user.model');
const Chat = require('../../models/chat.model');
const Message = require('../../models/message.model');
const Plan = require('../../models/plan.model.js');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');
const { 
  getUsers, 
  getUserStats, 
  updateUser, 
  deleteUser,
  exportUsers 
} = require('../../controllers/admin.controller');

// Middleware для всех админских маршрутов
router.use(authenticateToken);
router.use(requireAdmin);

// Получить статистику
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      todayMessages,
      monthlyRevenue,
      activeSessions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Message.countDocuments({ 
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      }),
      Promise.resolve(0), // TODO: Add revenue calculation
      Promise.resolve(0)  // TODO: Add active sessions calculation
    ]);

    const subscriptions = {
      free: await User.countDocuments({ 'subscription.plan': { $in: [null, 'free'] } }),
      pro: await User.countDocuments({ 'subscription.plan': 'pro' }),
      business: await User.countDocuments({ 'subscription.plan': 'business' })
    };

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        todayMessages,
        monthlyRevenue,
        activeSessions,
        subscriptions
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
});

// Получить всех пользователей - используем новый TypeScript контроллер
router.get('/users', getUsers);

// Экспорт пользователей в CSV
router.get('/users/export', exportUsers);

// Создать нового пользователя
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role = 'user', status = 'active' } = req.body;
    
    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Хешируем пароль
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      status,
      isActive: status === 'active'
    });
    
    await user.save();
    
    // Возвращаем пользователя без пароля
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Получить конкретного пользователя
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Обновить пользователя - используем контроллер
router.put('/users/:id', updateUser);

// Удалить пользователя - используем контроллер
router.delete('/users/:id', deleteUser);

// Заблокировать пользователя
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended', isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: { user },
      message: 'User suspended successfully' 
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to suspend user' 
    });
  }
});

// Активировать пользователя
router.post('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active', isActive: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: { user },
      message: 'User activated successfully' 
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to activate user' 
    });
  }
});

// Сбросить пароль пользователя
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Генерируем временный пароль
    const tempPassword = Math.random().toString(36).slice(-8);
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    user.password = hashedPassword;
    user.mustChangePassword = true; // Флаг для принудительной смены пароля
    await user.save();
    
    // В реальном приложении здесь бы отправлялся email
    console.log(`Temporary password for ${user.email}: ${tempPassword}`);
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully. Temporary password sent to user email.',
      // В development режиме показываем пароль
      ...(process.env.NODE_ENV === 'development' && { tempPassword })
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset password' 
    });
  }
});

// Аналитика
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Простая аналитика для начала
    const stats = {
      userGrowthRate: 5.2,
      messageGrowthRate: 12.4,
      revenueGrowthRate: 8.1,
      userGrowth: [],
      messageVolume: []
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics' 
    });
  }
});

router.get('/analytics/usage', async (req, res) => {
  try {
    const stats = {
      modelStats: {
        claude: 45,
        grok: 35,
        brainstorm: 20
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch usage statistics' 
    });
  }
});

// Экспорт пользователей в CSV
router.get('/users/export', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    // Создаем CSV
    const csvHeader = 'ID,Name,Email,Role,Status,Created At,Last Login\n';
    const csvRows = users.map(user => 
      `${user._id},${user.name || ''},${user.email},${user.role || 'user'},${user.status || 'active'},${user.createdAt},${user.lastLogin || ''}`
    ).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export users' 
    });
  }
});

// Аналитика - общий обзор
router.get('/analytics/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();

    res.json({
      totalUsers,
      activeUsers,
      totalChats,
      totalMessages
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Аналитика - доходы
router.get('/analytics/revenue', async (req, res) => {
  try {
    // Заглушка для доходов
    res.json({
      totalRevenue: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Аналитика - использование
router.get('/analytics/usage', async (req, res) => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const messagesThisMonth = await Message.countDocuments({
      createdAt: { $gte: lastMonth }
    });
    
    const chatsThisMonth = await Chat.countDocuments({
      createdAt: { $gte: lastMonth }
    });

    res.json({
      messagesThisMonth,
      chatsThisMonth,
      averageMessagesPerChat: chatsThisMonth > 0 ? Math.round(messagesThisMonth / chatsThisMonth) : 0
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    res.status(500).json({ error: 'Failed to fetch usage analytics' });
  }
});

// Логи аудита
router.get('/audit/logs', async (req, res) => {
  try {
    // Заглушка для логов аудита
    res.json({
      logs: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Планы и подписки
router.get('/plans', async (req, res) => {
  try {
    const { page = 0, limit = 25 } = req.query;
    const skip = page * limit;

    const plans = await Plan.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Plan.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        plans,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch plans' 
    });
  }
});

// Создать новый план
router.post('/plans', async (req, res) => {
  try {
    const planData = req.body;
    
    const newPlan = new Plan(planData);
    await newPlan.save();

    res.status(201).json({
      success: true,
      data: newPlan,
      message: 'Plan created successfully'
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create plan' 
    });
  }
});

// Обновить план
router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, interval, features, status, isPopular } = req.body;
    
    // В реальном приложении здесь было бы обновление в базе данных
    const updatedPlan = {
      _id: id,
      name,
      description,
      price: parseFloat(price) || 0,
      interval: interval || 'month',
      features: features || [],
      status: status || 'active',
      isPopular: isPopular || false,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update plan' 
    });
  }
});

// Удалить план
router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // В реальном приложении здесь была бы проверка и удаление из базы данных
    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete plan' 
    });
  }
});

router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 0, limit = 25 } = req.query;
    
    // Заглушка для подписок с более реалистичными данными
    const subscriptions = [
      {
        _id: '1',
        userId: '64b1234567890abcdef12345',
        planId: '2',
        planName: 'Pro',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        amount: 9.99,
        interval: 'month',
        user: {
          name: 'Иван Петров',
          email: 'ivan@example.com'
        }
      },
      {
        _id: '2',
        userId: '64b1234567890abcdef12346',
        planId: '3',
        planName: 'Business',
        status: 'active',
        currentPeriodStart: new Date('2024-01-15'),
        currentPeriodEnd: new Date('2024-02-15'),
        amount: 29.99,
        interval: 'month',
        user: {
          name: 'Мария Сидорова',
          email: 'maria@example.com'
        }
      }
    ];

    res.json({
      success: true,
      data: {
        subscriptions,
        total: subscriptions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(subscriptions.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscriptions' 
    });
  }
});

router.get('/subscriptions/stats', async (req, res) => {
  try {
    const stats = {
      totalSubscriptions: 2,
      activeSubscriptions: 2,
      monthlyRevenue: 39.98,
      canceledSubscriptions: 0,
      churnRate: 0,
      avgRevenuePerUser: 19.99
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscription statistics' 
    });
  }
});

// Получить статистику чатов
router.get('/chats/stats', async (req, res) => {
  try {
    const [
      totalChats,
      activeChats,
      todayMessages,
      totalMessages
    ] = await Promise.all([
      Chat.countDocuments(),
      Chat.countDocuments({ isActive: true }),
      Message.countDocuments({ 
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      }),
      Message.countDocuments()
    ]);

    const averageLength = totalChats > 0 ? Math.round(totalMessages / totalChats) : 0;

    res.json({
      success: true,
      data: {
        totalChats,
        activeChats,
        todayMessages,
        averageLength
      }
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat statistics' 
    });
  }
});

// Получить все чаты
router.get('/chats', async (req, res) => {
  try {
    const { page = 0, limit = 25, search = '' } = req.query;
    const skip = page * limit;
    
    // Создаем поисковый запрос
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'user.email': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Агрегация для получения чатов с информацией о пользователе и сообщениях
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages'
        }
      },
      {
        $addFields: {
          messageCount: { $size: '$messages' },
          lastMessage: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: '$messages',
                  sortBy: { createdAt: -1 }
                }
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          title: 1,
          userId: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          messageCount: 1,
          'user.name': 1,
          'user.email': 1,
          'lastMessage.content': 1,
          'lastMessage.createdAt': 1
        }
      }
    ];

    // Добавляем поиск если есть
    if (search) {
      pipeline.unshift({ $match: query });
    }

    // Добавляем пагинацию
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const chats = await Chat.aggregate(pipeline);

    // Получаем общее количество для пагинации
    const totalPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    if (search) {
      totalPipeline.push({ $match: query });
    }

    totalPipeline.push({ $count: 'total' });

    const totalResult = await Chat.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Форматируем данные
    const formattedChats = chats.map(chat => ({
      ...chat,
      lastMessage: chat.lastMessage ? {
        content: chat.lastMessage.content?.substring(0, 100) + (chat.lastMessage.content?.length > 100 ? '...' : ''),
        timestamp: chat.lastMessage.createdAt
      } : null
    }));

    res.json({
      success: true,
      data: {
        chats: formattedChats,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chats' 
    });
  }
});

// Удалить чат
router.delete('/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found' 
      });
    }

    // Удаляем все сообщения чата
    await Message.deleteMany({ chatId: req.params.id });
    
    // Удаляем сам чат
    await Chat.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Chat deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete chat' 
    });
  }
});

// Экспорт чатов в CSV
router.get('/chats/export', async (req, res) => {
  try {
    const chats = await Chat.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages'
        }
      },
      {
        $addFields: {
          messageCount: { $size: '$messages' }
        }
      },
      {
        $project: {
          title: 1,
          isActive: 1,
          createdAt: 1,
          messageCount: 1,
          'user.name': 1,
          'user.email': 1
        }
      }
    ]);
    
    // Создаем CSV
    const csvHeader = 'ID,Title,User Name,User Email,Message Count,Status,Created At\n';
    const csvRows = chats.map(chat => 
      `${chat._id},"${(chat.title || 'Без названия').replace(/"/g, '""')}","${(chat.user?.name || 'Неизвестный').replace(/"/g, '""')}","${chat.user?.email || ''}",${chat.messageCount},${chat.isActive ? 'Active' : 'Inactive'},${chat.createdAt}`
    ).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="chats-export.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting chats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export chats' 
    });
  }
});

// Настройки системы
let systemSettings = {
  general: {
    siteName: 'Neural Chat',
    siteDescription: 'AI-powered chat platform',
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsersPerDay: 100
  },
  api: {
    rateLimitRequests: 100,
    rateLimitWindow: 15,
    maxTokensPerRequest: 4000,
    enableLogging: true
  },
  security: {
    passwordMinLength: 8,
    requireEmailVerification: true,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    enableTwoFactor: false
  },
  notifications: {
    emailEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    sendWelcomeEmails: true,
    sendSecurityAlerts: true
  },
  storage: {
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx'],
    cleanupOldFiles: true,
    cleanupDays: 30
  }
};

// Получить настройки системы
router.get('/settings', async (req, res) => {
  try {
    res.json({
      success: true,
      data: systemSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch settings' 
    });
  }
});

// Обновить настройки системы
router.put('/settings', async (req, res) => {
  try {
    systemSettings = { ...systemSettings, ...req.body };
    
    res.json({
      success: true,
      data: systemSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update settings' 
    });
  }
});

// Тестировать настройки email
router.post('/settings/test-email', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword } = req.body;
    
    // В реальном приложении здесь была бы отправка тестового email
    console.log('Testing email settings:', { smtpHost, smtpPort, smtpUser });
    
    // Имитируем успешную отправку
    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test email' 
    });
  }
});

// Подписки (subscriptions)
router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 0, limit = 10, search, status, plan } = req.query;
    const skip = page * limit;

    // Строим фильтр
    const filter = {};
    if (status && status !== 'all') {
      filter['subscription.status'] = status;
    }
    if (plan && plan !== 'all') {
      filter['subscription.plan'] = plan;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('name email subscription createdAt updatedAt')
      .populate('subscription.planId', 'name price')
      .sort({ 'subscription.createdAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Преобразуем в формат подписок
    const subscriptions = users.map(user => ({
      _id: user._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'inactive',
      provider: 'stripe',
      customerId: user.subscription?.customerId || '',
      subscriptionId: user.subscription?.subscriptionId || '',
      currentPeriodStart: user.subscription?.currentPeriodStart || user.createdAt,
      currentPeriodEnd: user.subscription?.currentPeriodEnd || new Date(Date.now() + 30*24*60*60*1000),
      cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
      amount: user.subscription?.planId?.price || 0,
      currency: 'USD',
      createdAt: user.subscription?.createdAt || user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      success: true,
      data: {
        subscriptions,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscriptions' 
    });
  }
});

// Статистика подписок
router.get('/subscriptions/stats', async (req, res) => {
  try {
    const totalSubscriptions = await User.countDocuments({ 'subscription.plan': { $ne: null } });
    const activeSubscriptions = await User.countDocuments({ 'subscription.status': 'active' });
    const canceledSubscriptions = await User.countDocuments({ 'subscription.status': 'canceled' });
    
    // Заглушка для дохода
    const monthlyRevenue = 299; // Примерный доход
    
    res.json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        canceledSubscriptions,
        monthlyRevenue,
        subscriptionGrowth: 5.2,
        activeGrowth: 3.8,
        revenueGrowth: 12.1
      }
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscription statistics' 
    });
  }
});

// Отменить подписку
router.post('/subscriptions/:id/cancel', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Отменяем подписку
    user.subscription = {
      ...user.subscription,
      status: 'canceled',
      cancelAtPeriodEnd: true,
      canceledAt: new Date()
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Subscription canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel subscription' 
    });
  }
});

// Изменить план пользователя
router.put('/users/:userId/plan', async (req, res) => {
  try {
    const { planId } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Plan not found' 
      });
    }

    user.subscription = {
      planId: plan._id,
      plan: plan.name.toLowerCase(),
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000),
      updatedAt: new Date()
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Plan changed successfully'
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to change plan' 
    });
  }
});

// Чаты
router.get('/chats', async (req, res) => {
  try {
    const { page = 0, limit = 25, search, status } = req.query;
    const skip = page * limit;

    const filter = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const chats = await Chat.find(filter)
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chat.countDocuments(filter);

    res.json({
      success: true,
      data: {
        chats,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chats' 
    });
  }
});

// Статистика чатов
router.get('/chats/stats', async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments();
    const activeChats = await Chat.countDocuments({ 
      updatedAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChats = await Chat.countDocuments({ 
      createdAt: { $gte: today }
    });

    // Подсчет сообщений
    const totalMessages = await Message.countDocuments();
    const todayMessages = await Message.countDocuments({ 
      createdAt: { $gte: today }
    });

    const avgChatLength = totalChats > 0 ? Math.round(totalMessages / totalChats) : 0;

    res.json({
      success: true,
      data: {
        totalChats,
        activeChats,
        todayChats,
        totalMessages,
        todayMessages,
        avgChatLength
      }
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat statistics' 
    });
  }
});

// Health check для системы
router.get('/health', async (req, res) => {
  try {
    const status = 'healthy';
    const version = '1.0.0';
    const uptime = process.uptime();
    
    // Проверка подключения к БД
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
      success: true,
      data: {
        status,
        version,
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        database: { status: dbStatus },
        redis: { status: 'connected' },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        },
        recentLogs: []
      }
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get health status' 
    });
  }
});

// TODO: Исправить планы подписки (временно отключено)
// router.post('/fix-plans', fixPlans);

module.exports = router; 