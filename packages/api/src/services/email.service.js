const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // В development режиме не инициализируем SendGrid
    if (process.env.NODE_ENV !== 'development' && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@smartchat.ai';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async sendEmail(to, subject, html, text) {
    try {
      // В development режиме просто логируем
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[DEV] Email would be sent to ${to}: ${subject}`);
        return;
      }

      if (!process.env.SENDGRID_API_KEY) {
        logger.warn('SendGrid API key not configured, skipping email');
        return;
      }

      const msg = {
        to,
        from: this.fromEmail,
        subject,
        text,
        html
      };

      await sgMail.send(msg);
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error('Email sending failed:', error);
      // В development не бросаем ошибку
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
    }
  }

  async sendVerificationEmail(email, name, token) {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to SmartChat.ai!</h2>
        <p>Hi ${name},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          If you didn't sign up for SmartChat.ai, please ignore this email.
        </p>
      </div>
    `;

    const text = `
      Welcome to SmartChat.ai!
      
      Hi ${name},
      
      Thanks for signing up! Please verify your email address by visiting:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't sign up for SmartChat.ai, please ignore this email.
    `;

    await this.sendEmail(email, 'Verify your SmartChat.ai account', html, text);
  }

  async sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          For security reasons, this link will expire in 1 hour.
        </p>
      </div>
    `;

    const text = `
      Password Reset Request
      
      Hi ${name},
      
      We received a request to reset your password. Visit the link below to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
    `;

    await this.sendEmail(email, 'Reset your SmartChat.ai password', html, text);
  }

  async sendPasswordChangedEmail(email, name) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Password Changed Successfully</h2>
        <p>Hi ${name},</p>
        <p>This email confirms that your SmartChat.ai password has been successfully changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.frontendUrl}/support" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Contact Support
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated security notification.
        </p>
      </div>
    `;

    const text = `
      Password Changed Successfully
      
      Hi ${name},
      
      This email confirms that your SmartChat.ai password has been successfully changed.
      
      If you did not make this change, please contact our support team immediately at:
      ${this.frontendUrl}/support
      
      This is an automated security notification.
    `;

    await this.sendEmail(email, 'Your SmartChat.ai password has been changed', html, text);
  }

  async sendSubscriptionConfirmation(email, name, plan) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to SmartChat.ai ${plan}!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for subscribing to SmartChat.ai ${plan} plan!</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your ${plan} plan includes:</h3>
          <ul style="list-style: none; padding: 0;">
            ${plan === 'Pro' ? `
              <li>✓ 100 messages per day</li>
              <li>✓ All Claude models</li>
              <li>✓ All Grok models</li>
              <li>✓ Projects & file uploads</li>
              <li>✓ Priority support</li>
            ` : `
              <li>✓ Unlimited messages</li>
              <li>✓ All AI models</li>
              <li>✓ Brainstorm Mode</li>
              <li>✓ Team collaboration</li>
              <li>✓ API access</li>
              <li>✓ Premium support</li>
            `}
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.frontendUrl}/chat/claude" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Chatting
          </a>
        </div>
        <p>Manage your subscription anytime from your account settings.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Thank you for choosing SmartChat.ai!
        </p>
      </div>
    `;

    const text = `
      Welcome to SmartChat.ai ${plan}!
      
      Hi ${name},
      
      Thank you for subscribing to SmartChat.ai ${plan} plan!
      
      Your plan includes:
      ${plan === 'Pro' ? 
        '- 100 messages per day\n- All Claude models\n- All Grok models\n- Projects & file uploads\n- Priority support' :
        '- Unlimited messages\n- All AI models\n- Brainstorm Mode\n- Team collaboration\n- API access\n- Premium support'
      }
      
      Start chatting at: ${this.frontendUrl}/chat/claude
      
      Manage your subscription anytime from your account settings.
      
      Thank you for choosing SmartChat.ai!
    `;

    await this.sendEmail(email, `Welcome to SmartChat.ai ${plan}!`, html, text);
  }

  async sendSubscriptionCanceled(email, name, endDate) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Subscription Cancellation Confirmed</h2>
        <p>Hi ${name},</p>
        <p>We're sorry to see you go! Your SmartChat.ai subscription has been canceled.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Important:</strong> You'll continue to have access to your subscription benefits until ${endDate}.</p>
        </div>
        <p>We'd love to hear your feedback on how we can improve SmartChat.ai.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.frontendUrl}/feedback" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Share Feedback
          </a>
        </div>
        <p>You can reactivate your subscription anytime from your account settings.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Thank you for being a SmartChat.ai user!
        </p>
      </div>
    `;

    const text = `
      Subscription Cancellation Confirmed
      
      Hi ${name},
      
      We're sorry to see you go! Your SmartChat.ai subscription has been canceled.
      
      Important: You'll continue to have access to your subscription benefits until ${endDate}.
      
      We'd love to hear your feedback at: ${this.frontendUrl}/feedback
      
      You can reactivate your subscription anytime from your account settings.
      
      Thank you for being a SmartChat.ai user!
    `;

    await this.sendEmail(email, 'Your SmartChat.ai subscription has been canceled', html, text);
  }

  async sendPaymentFailed(email, name) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Payment Failed</h2>
        <p>Hi ${name},</p>
        <p>We were unable to process your payment for SmartChat.ai subscription.</p>
        <p>Please update your payment method to continue enjoying uninterrupted access to SmartChat.ai.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.frontendUrl}/subscription" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Update Payment Method
          </a>
        </div>
        <p>If you need assistance, please contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Your subscription will be suspended if payment is not received within 7 days.
        </p>
      </div>
    `;

    const text = `
      Payment Failed
      
      Hi ${name},
      
      We were unable to process your payment for SmartChat.ai subscription.
      
      Please update your payment method at: ${this.frontendUrl}/subscription
      
      If you need assistance, please contact our support team.
      
      Your subscription will be suspended if payment is not received within 7 days.
    `;

    await this.sendEmail(email, 'Action Required: Payment Failed for SmartChat.ai', html, text);
  }
}

module.exports = new EmailService();