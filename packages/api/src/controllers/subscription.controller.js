const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const stripeService = require('../services/stripe.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Get subscription plans
exports.getPlans = async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '10 messages per day',
          'Claude 3.5 Sonnet',
          'Grok 2',
          'Basic features'
        ],
        limits: {
          dailyMessages: 10,
          models: ['claude-3.5-sonnet', 'grok-2']
        }
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 19,
        currency: 'USD',
        interval: 'month',
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
        features: [
          '100 messages per day',
          'All Claude models',
          'All Grok models',
          'Projects & file uploads',
          'Priority support'
        ],
        limits: {
          dailyMessages: 100,
          models: ['claude-4-opus', 'claude-4-sonnet', 'claude-3.5-sonnet', 'grok-3', 'grok-2']
        }
      },
      {
        id: 'business',
        name: 'Business',
        price: 49,
        currency: 'USD',
        interval: 'month',
        stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
        features: [
          'Unlimited messages',
          'All models',
          'Brainstorm Mode',
          'Team collaboration',
          'API access',
          'Premium support'
        ],
        limits: {
          dailyMessages: Infinity,
          models: ['claude-4-opus', 'claude-4-sonnet', 'claude-3.5-sonnet', 'grok-3', 'grok-2']
        }
      }
    ];

    res.json(apiResponse(true, { plans }));
  } catch (error) {
    next(error);
  }
};

// Create checkout session
exports.createCheckout = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Get price ID based on plan
    const priceId = planId === 'pro' 
      ? process.env.STRIPE_PRO_PRICE_ID 
      : process.env.STRIPE_BUSINESS_PRICE_ID;

    if (!priceId) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'INVALID_PLAN',
        message: 'Invalid subscription plan'
      }));
    }

    const session = await stripeService.createCheckoutSession({
      customerId: user.subscription.customerId,
      customerEmail: user.email,
      priceId,
      successUrl: `${process.env.FRONTEND_URL}/subscription?success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        planId
      }
    });

    res.json(apiResponse(true, {
      checkoutUrl: session.url,
      sessionId: session.id
    }));
  } catch (error) {
    next(error);
  }
};

// Create billing portal session
exports.createPortal = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    if (!user.subscription.customerId) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_CUSTOMER',
        message: 'No billing account found'
      }));
    }

    const session = await stripeService.createPortalSession({
      customerId: user.subscription.customerId,
      returnUrl: `${process.env.FRONTEND_URL}/subscription`
    });

    res.json(apiResponse(true, {
      portalUrl: session.url
    }));
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    if (!user.subscription.subscriptionId) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_SUBSCRIPTION',
        message: 'No active subscription found'
      }));
    }

    const subscription = await stripeService.cancelSubscription(
      user.subscription.subscriptionId
    );

    // Update user subscription
    user.subscription.status = 'canceled';
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    res.json(apiResponse(true, {
      message: 'Subscription will be canceled at the end of the billing period',
      subscription
    }));
  } catch (error) {
    next(error);
  }
};

// Resume subscription
exports.resumeSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    if (!user.subscription.subscriptionId) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_SUBSCRIPTION',
        message: 'No subscription found'
      }));
    }

    const subscription = await stripeService.resumeSubscription(
      user.subscription.subscriptionId
    );

    // Update user subscription
    user.subscription.status = 'active';
    user.subscription.cancelAtPeriodEnd = false;
    await user.save();

    res.json(apiResponse(true, {
      message: 'Subscription resumed successfully',
      subscription
    }));
  } catch (error) {
    next(error);
  }
};

// Change subscription plan
exports.changePlan = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    if (!user.subscription.subscriptionId) {
      // Create new subscription
      return this.createCheckout(req, res, next);
    }

    // Get price ID based on plan
    const priceId = planId === 'pro' 
      ? process.env.STRIPE_PRO_PRICE_ID 
      : process.env.STRIPE_BUSINESS_PRICE_ID;

    const subscription = await stripeService.updateSubscription(
      user.subscription.subscriptionId,
      priceId
    );

    // Update user subscription
    user.subscription.plan = planId;
    await user.save();

    res.json(apiResponse(true, {
      message: 'Subscription plan updated successfully',
      subscription
    }));
  } catch (error) {
    next(error);
  }
};

// Get subscription status
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    let stripeSubscription = null;
    if (user.subscription.subscriptionId) {
      stripeSubscription = await stripeService.getSubscription(
        user.subscription.subscriptionId
      );
    }

    res.json(apiResponse(true, {
      subscription: user.subscription,
      stripeSubscription
    }));
  } catch (error) {
    next(error);
  }
};

// Stripe webhook
exports.stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripeService.constructWebhookEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

// Handle checkout complete
exports.handleCheckoutComplete = async (session) => {
  const userId = session.metadata.userId;
  const planId = session.metadata.planId;

  const user = await User.findById(userId);
  if (!user) return;

  // Update subscription
  user.subscription = {
    plan: planId,
    status: 'active',
    provider: 'stripe',
    customerId: session.customer,
    subscriptionId: session.subscription,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  await user.save();

  // Create subscription record
  await Subscription.create({
    userId: user._id,
    platform: 'web',
    provider: 'stripe',
    plan: planId,
    status: 'active',
    customerId: session.customer,
    subscriptionId: session.subscription,
    priceId: session.line_items?.data[0]?.price?.id
  });
};

// Handle subscription update
exports.handleSubscriptionUpdate = async (subscription) => {
  const user = await User.findOne({
    'subscription.subscriptionId': subscription.id
  });
  
  if (!user) return;

  user.subscription.status = subscription.status;
  user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
  user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await user.save();
};

// Handle subscription deleted
exports.handleSubscriptionDeleted = async (subscription) => {
  const user = await User.findOne({
    'subscription.subscriptionId': subscription.id
  });
  
  if (!user) return;

  user.subscription = {
    plan: 'free',
    status: 'active',
    provider: null,
    customerId: user.subscription.customerId,
    subscriptionId: null
  };

  await user.save();
};

// Handle payment succeeded
exports.handlePaymentSucceeded = async (invoice) => {
  const user = await User.findOne({
    'subscription.customerId': invoice.customer
  });
  
  if (!user) return;

  user.subscription.status = 'active';
  await user.save();
};

// Handle payment failed
exports.handlePaymentFailed = async (invoice) => {
  const user = await User.findOne({
    'subscription.customerId': invoice.customer
  });
  
  if (!user) return;

  user.subscription.status = 'past_due';
  await user.save();
};

// Mobile receipt verification - Apple
exports.verifyAppleReceipt = async (req, res, next) => {
  try {
    const { receipt } = req.body;
    
    // TODO: Implement Apple receipt verification
    // This would involve calling Apple's verification API
    
    res.json(apiResponse(true, {
      message: 'Apple receipt verification not implemented'
    }));
  } catch (error) {
    next(error);
  }
};

// Mobile receipt verification - Google
exports.verifyGoogleReceipt = async (req, res, next) => {
  try {
    const { purchaseToken } = req.body;
    
    // TODO: Implement Google receipt verification
    // This would involve calling Google Play API
    
    res.json(apiResponse(true, {
      message: 'Google receipt verification not implemented'
    }));
  } catch (error) {
    next(error);
  }
};

// Restore purchases
exports.restorePurchases = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // TODO: Implement restore purchases for mobile
    
    res.json(apiResponse(true, {
      subscription: user.subscription
    }));
  } catch (error) {
    next(error);
  }
};

// Webhook placeholders
exports.appleWebhook = async (req, res) => {
  res.json({ received: true });
};

exports.googleWebhook = async (req, res) => {
  res.json({ received: true });
};