const Stripe = require('stripe');
const logger = require('../utils/logger');

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  // Create checkout session
  async createCheckoutSession({
    customerId,
    customerEmail,
    priceId,
    successUrl,
    cancelUrl,
    metadata = {}
  }) {
    try {
      const sessionConfig = {
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        subscription_data: {
          trial_period_days: 7
        }
      };

      if (customerId) {
        sessionConfig.customer = customerId;
      } else {
        sessionConfig.customer_email = customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(sessionConfig);
      return session;
    } catch (error) {
      logger.error('Stripe checkout session creation failed:', error);
      throw error;
    }
  }

  // Create billing portal session
  async createPortalSession({ customerId, returnUrl }) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
      return session;
    } catch (error) {
      logger.error('Stripe portal session creation failed:', error);
      throw error;
    }
  }

  // Get subscription
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Stripe subscription retrieval failed:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: true }
      );
      return subscription;
    } catch (error) {
      logger.error('Stripe subscription cancellation failed:', error);
      throw error;
    }
  }

  // Resume subscription
  async resumeSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: false }
      );
      return subscription;
    } catch (error) {
      logger.error('Stripe subscription resume failed:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          items: [{
            id: subscription.items.data[0].id,
            price: newPriceId
          }],
          proration_behavior: 'create_prorations'
        }
      );
      
      return updatedSubscription;
    } catch (error) {
      logger.error('Stripe subscription update failed:', error);
      throw error;
    }
  }

  // Create customer
  async createCustomer({ email, name, metadata = {} }) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata
      });
      return customer;
    } catch (error) {
      logger.error('Stripe customer creation failed:', error);
      throw error;
    }
  }

  // Get customer
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      logger.error('Stripe customer retrieval failed:', error);
      throw error;
    }
  }

  // Get invoices
  async getInvoices(customerId, limit = 10) {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit
      });
      return invoices.data;
    } catch (error) {
      logger.error('Stripe invoices retrieval failed:', error);
      throw error;
    }
  }

  // Create payment intent (for one-time payments)
  async createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        metadata
      });
      return paymentIntent;
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      throw error;
    }
  }

  // Construct webhook event
  constructWebhookEvent(payload, signature, secret) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      logger.error('Stripe webhook construction failed:', error);
      throw error;
    }
  }

  // Get price
  async getPrice(priceId) {
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return price;
    } catch (error) {
      logger.error('Stripe price retrieval failed:', error);
      throw error;
    }
  }

  // List prices
  async listPrices(productId = null) {
    try {
      const params = { active: true };
      if (productId) {
        params.product = productId;
      }
      
      const prices = await this.stripe.prices.list(params);
      return prices.data;
    } catch (error) {
      logger.error('Stripe prices list failed:', error);
      throw error;
    }
  }

  // Create usage record (for metered billing)
  async createUsageRecord(subscriptionItemId, quantity, timestamp = Date.now()) {
    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: Math.floor(timestamp / 1000)
        }
      );
      return usageRecord;
    } catch (error) {
      logger.error('Stripe usage record creation failed:', error);
      throw error;
    }
  }

  // Add invoice item
  async addInvoiceItem({ customerId, amount, description, metadata = {} }) {
    try {
      const invoiceItem = await this.stripe.invoiceItems.create({
        customer: customerId,
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        description,
        metadata
      });
      return invoiceItem;
    } catch (error) {
      logger.error('Stripe invoice item creation failed:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();