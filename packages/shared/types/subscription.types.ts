// packages/shared/types/subscription.types.ts

export interface Subscription {
  _id: string;
  userId: string;
  platform: SubscriptionPlatform;
  provider: SubscriptionProvider;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  priceId?: string;
  productId?: string;
  customerId?: string;
  subscriptionId?: string;
  originalTransactionId?: string; // for mobile
  latestReceiptData?: string; // for Apple
  purchaseToken?: string; // for Google
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  cancelReason?: string;
  metadata?: Record<string, any>;
  history: SubscriptionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlatform = 'web' | 'ios' | 'android';
export type SubscriptionProvider = 'stripe' | 'apple' | 'google';
export type SubscriptionPlan = 'free' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface SubscriptionHistoryEntry {
  action: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  dailyMessages: number;
  models: string[];
  maxTokensPerMessage?: number;
  maxFileSize?: number;
  maxFilesPerProject?: number;
}

export interface CreateCheckoutRequest {
  planId: SubscriptionPlan;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface CreatePortalResponse {
  portalUrl: string;
}

export interface ChangePlanRequest {
  planId: SubscriptionPlan;
}

export interface SubscriptionStatusResponse {
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    provider?: SubscriptionProvider;
    customerId?: string;
    subscriptionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: string;
  };
  stripeSubscription?: any; // Stripe subscription object
}

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount: number;
  currency: string;
  description?: string;
  created: number;
  dueDate?: number;
  paidAt?: number;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

export interface VerifyAppleReceiptRequest {
  receipt: string;
}

export interface VerifyGoogleReceiptRequest {
  purchaseToken: string;
}

export interface SubscriptionWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export interface StripeWebhookEvents {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed';
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated';
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted';
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded';
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed';
}

export interface SubscriptionFeatures {
  free: {
    dailyMessages: 10;
    models: ['claude-3.5-sonnet', 'grok-2'];
    projects: false;
    brainstorm: false;
    apiAccess: false;
    support: 'community';
  };
  pro: {
    dailyMessages: 100;
    models: ['claude-4-opus', 'claude-4-sonnet', 'claude-3.5-sonnet', 'grok-3', 'grok-2'];
    projects: true;
    brainstorm: true;
    apiAccess: false;
    support: 'priority';
  };
  business: {
    dailyMessages: number; // Infinity
    models: ['claude-4-opus', 'claude-4-sonnet', 'claude-3.5-sonnet', 'grok-3', 'grok-2'];
    projects: true;
    brainstorm: true;
    apiAccess: true;
    support: 'premium';
  };
}