// packages/shared/types/user.types.ts

export interface User {
  _id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  role: UserRole;
  authProviders: AuthProvider[];
  subscription: UserSubscription;
  usage: UserUsage;
  settings: UserSettings;
  devices: UserDevice[];
  security: UserSecurity;
  status: UserStatus;
  metadata: UserMetadata;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'user' | 'admin' | 'moderator';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface AuthProvider {
  provider: 'email' | 'google' | 'apple';
  providerId: string;
  profile?: Record<string, any>;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider?: SubscriptionProvider;
  customerId?: string;
  subscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type SubscriptionProvider = 'stripe' | 'apple' | 'google';

export interface UserUsage {
  dailyMessages: number;
  resetDate?: string;
  totalMessages: number;
  totalTokens: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ru' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
  defaultModel: string;
  fontSize: number;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  chatMessages: boolean;
  brainstormUpdates: boolean;
  marketing: boolean;
}

export interface UserDevice {
  deviceId: string;
  platform: string;
  model: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  lastActive: string;
}

export interface UserSecurity {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockUntil?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

export interface UserMetadata {
  lastLogin?: string;
  lastActivity?: string;
  loginCount: number;
  referralCode?: string;
  referredBy?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  referralCode?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface UpdateSettingsRequest {
  settings: Partial<UserSettings>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface AppleAuthRequest {
  identityToken: string;
  user?: {
    fullName?: string;
  };
}

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  message: string;
}

export interface Verify2FARequest {
  token: string;
}

export interface RegisterDeviceRequest {
  deviceId: string;
  platform: string;
  model: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string;
}

export interface UserUsageResponse {
  daily: {
    messages: number;
    limit: number;
    resetAt?: string;
  };
  total: {
    messages: number;
    tokens: number;
    chats: number;
    messagesInDb: number;
  };
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
  };
}