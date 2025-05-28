const router = require('express').Router();
const User = require('../../models/user.model');
const Chat = require('../../models/chat.model');
const Message = require('../../models/message.model');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');

// Middleware для всех админских маршрутов
router.use(authenticateToken);
router.use(requireAdmin);

// Получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const { page = 0, limit = 25, search = '' } = req.query;
    const skip = page * limit;
    
    const query = search ? {
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
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

// Обновить пользователя
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

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

module.exports = router; 