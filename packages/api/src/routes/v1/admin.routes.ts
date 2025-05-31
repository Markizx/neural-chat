import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  getUsers,
  getUserStats,
  updateUser,
  deleteUser,
  getAnalytics,
  getRevenue,
  getUsage,
  getSystemLogs,
  getSubscriptions,
  updateSubscription,
  getSubscriptionStats,
  cancelSubscription,
  extendSubscription,
  refundSubscription,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  changeUserPlan,
} from '../../controllers/admin.controller';

const router = Router();

// Все роуты требуют авторизации и роль admin
router.use(authenticate);
router.use(authorize(['admin']));

// User management
router.get('/users', getUsers);
router.get('/users/stats', getUserStats);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// Analytics
router.get('/analytics', getAnalytics);
router.get('/analytics/revenue', getRevenue);
router.get('/analytics/usage', getUsage);

// System
router.get('/logs', getSystemLogs);

// Subscriptions
router.get('/subscriptions', getSubscriptions);
router.get('/subscriptions/stats', getSubscriptionStats);
router.put('/subscriptions/:id', updateSubscription);
router.post('/subscriptions/:id/cancel', cancelSubscription);
router.post('/subscriptions/:id/extend', extendSubscription);
router.post('/subscriptions/:id/refund', refundSubscription);

// Plans management
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// User plan management
router.post('/users/:id/change-plan', changeUserPlan);

export default router; 