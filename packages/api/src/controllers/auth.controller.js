const User = require('../models/user.model');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json(apiResponse(false, null, {
        code: 'USER_EXISTS',
        message: 'User with this email already exists'
      }));
    }

    // Create user
    const user = new User({
      email,
      password,
      name,
      authProviders: [{ provider: 'email', providerId: email }]
    });

    // Generate referral code
    user.generateReferralCode();

    // Handle referral
    if (req.body.referralCode) {
      const referrer = await User.findOne({ 'metadata.referralCode': req.body.referralCode });
      if (referrer) {
        user.metadata.referredBy = referrer._id;
      }
    }

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user._id);

    // Send verification email
    const verificationToken = authService.generateVerificationToken(user._id);
    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(201).json(apiResponse(true, {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }));
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, status: 'active' });
    if (!user) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }));
    }

    // Check if account is locked
    if (user.security.lockUntil && user.security.lockUntil > Date.now()) {
      return res.status(423).json(apiResponse(false, null, {
        code: 'ACCOUNT_LOCKED',
        message: 'Account is locked due to too many failed login attempts'
      }));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      user.security.loginAttempts += 1;
      
      // Lock account after 5 attempts
      if (user.security.loginAttempts >= 5) {
        user.security.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }));
    }

    // Reset login attempts
    user.security.loginAttempts = 0;
    user.security.lockUntil = undefined;
    user.metadata.lastLogin = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user._id);

    res.json(apiResponse(true, {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }));
  } catch (error) {
    next(error);
  }
};

// Apple OAuth
exports.appleAuth = async (req, res, next) => {
  try {
    const { identityToken, user: appleUser } = req.body;

    // Verify Apple token
    const verifiedUser = await authService.verifyAppleToken(identityToken);
    if (!verifiedUser) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_TOKEN',
        message: 'Invalid Apple token'
      }));
    }

    // Find or create user
    let user = await User.findOne({ email: verifiedUser.email });
    
    if (!user) {
      // Create new user
      user = new User({
        email: verifiedUser.email,
        name: appleUser?.fullName || verifiedUser.email.split('@')[0],
        emailVerified: true,
        authProviders: [{
          provider: 'apple',
          providerId: verifiedUser.sub,
          profile: verifiedUser
        }]
      });
      user.generateReferralCode();
      await user.save();
    } else {
      // Add Apple provider if not exists
      const hasAppleProvider = user.authProviders.some(p => p.provider === 'apple');
      if (!hasAppleProvider) {
        user.authProviders.push({
          provider: 'apple',
          providerId: verifiedUser.sub,
          profile: verifiedUser
        });
        await user.save();
      }
    }

    // Update login metadata
    user.metadata.lastLogin = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user._id);

    res.json(apiResponse(true, {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }));
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect'
      }));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(user.email, user.name);

    res.json(apiResponse(true, { message: 'Password changed successfully' }));
  } catch (error) {
    next(error);
  }
};

// Enable 2FA
exports.enable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Generate 2FA secret
    const { secret, qrCode } = authService.generate2FASecret(user.email);
    
    user.security.twoFactorSecret = secret;
    await user.save();

    res.json(apiResponse(true, {
      secret,
      qrCode,
      message: 'Scan the QR code with your authenticator app'
    }));
  } catch (error) {
    next(error);
  }
};

// Verify 2FA
exports.verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user._id);
    if (!user || !user.security.twoFactorSecret) {
      return res.status(400).json(apiResponse(false, null, {
        code: '2FA_NOT_SETUP',
        message: '2FA is not set up for this account'
      }));
    }

    // Verify token
    const isValid = authService.verify2FAToken(user.security.twoFactorSecret, token);
    if (!isValid) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_2FA_TOKEN',
        message: 'Invalid 2FA token'
      }));
    }

    user.security.twoFactorEnabled = true;
    await user.save();

    res.json(apiResponse(true, { message: '2FA enabled successfully' }));
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
exports.disable2FA = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_PASSWORD',
        message: 'Invalid password'
      }));
    }

    user.security.twoFactorEnabled = false;
    user.security.twoFactorSecret = undefined;
    await user.save();

    res.json(apiResponse(true, { message: '2FA disabled successfully' }));
  } catch (error) {
    next(error);
  }
};

// Resend verification email
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    if (user.emailVerified) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'Email is already verified'
      }));
    }

    // Generate verification token
    const verificationToken = authService.generateVerificationToken(user._id);
    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    res.json(apiResponse(true, { message: 'Verification email sent' }));
  } catch (error) {
    next(error);
  }
};

// Device management
exports.registerDevice = async (req, res, next) => {
  try {
    const { deviceId, platform, model, osVersion, appVersion, pushToken } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Remove existing device with same ID
    user.devices = user.devices.filter(d => d.deviceId !== deviceId);

    // Add new device
    user.devices.push({
      deviceId,
      platform,
      model,
      osVersion,
      appVersion,
      pushToken,
      lastActive: new Date()
    });

    // Keep only last 5 devices
    if (user.devices.length > 5) {
      user.devices = user.devices.slice(-5);
    }

    await user.save();

    res.json(apiResponse(true, { message: 'Device registered successfully' }));
  } catch (error) {
    next(error);
  }
};

// Remove device
exports.removeDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    user.devices = user.devices.filter(d => d.deviceId !== deviceId);
    await user.save();

    res.json(apiResponse(true, { message: 'Device removed successfully' }));
  } catch (error) {
    next(error);
  }
};

// Get devices
exports.getDevices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    res.json(apiResponse(true, { devices: user.devices }));
  } catch (error) {
    next(error);
  }
};

// Logout all devices
exports.logoutAllDevices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    // Clear all devices
    user.devices = [];
    await user.save();

    // In production, you would also invalidate all refresh tokens

    res.json(apiResponse(true, { message: 'Logged out from all devices' }));
  } catch (error) {
    next(error);
  }
};
      user: user.toJSON(),
      accessToken,
      refreshToken
    }));
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_REFRESH_TOKEN',
        message: 'Refresh token is required'
      }));
    }

    // Verify refresh token
    const decoded = authService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      }));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = authService.generateTokens(decoded.userId);

    res.json(apiResponse(true, {
      accessToken,
      refreshToken: newRefreshToken
    }));
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    // In a production app, you might want to blacklist the token
    res.json(apiResponse(true, { message: 'Logged out successfully' }));
  } catch (error) {
    next(error);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const decoded = authService.verifyEmailToken(token);
    if (!decoded) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired verification token'
      }));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    user.emailVerified = true;
    await user.save();

    res.json(apiResponse(true, { message: 'Email verified successfully' }));
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json(apiResponse(true, { 
        message: 'If an account exists with this email, you will receive a password reset link' 
      }));
    }

    // Generate reset token
    const resetToken = authService.generatePasswordResetToken();
    user.security.passwordResetToken = authService.hashToken(resetToken);
    user.security.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json(apiResponse(true, { 
      message: 'If an account exists with this email, you will receive a password reset link' 
    }));
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = authService.hashToken(token);
    const user = await User.findOne({
      'security.passwordResetToken': hashedToken,
      'security.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token'
      }));
    }

    // Update password
    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(user.email, user.name);

    res.json(apiResponse(true, { message: 'Password reset successfully' }));
  } catch (error) {
    next(error);
  }
};

// Google OAuth
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    // Verify Google token
    const googleUser = await authService.verifyGoogleToken(idToken);
    if (!googleUser) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_TOKEN',
        message: 'Invalid Google token'
      }));
    }

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });
    
    if (!user) {
      // Create new user
      user = new User({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        emailVerified: true,
        authProviders: [{
          provider: 'google',
          providerId: googleUser.sub,
          profile: googleUser
        }]
      });
      user.generateReferralCode();
      await user.save();
    } else {
      // Add Google provider if not exists
      const hasGoogleProvider = user.authProviders.some(p => p.provider === 'google');
      if (!hasGoogleProvider) {
        user.authProviders.push({
          provider: 'google',
          providerId: googleUser.sub,
          profile: googleUser
        });
        await user.save();
      }
    }

    // Update login metadata
    user.metadata.lastLogin = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user._id);

    res.json(apiResponse(true, {