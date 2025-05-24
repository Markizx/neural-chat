const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwksClient = require('jwks-rsa');

class AuthService {
  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  // Generate tokens
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Generate verification token
  generateVerificationToken(userId) {
    const token = jwt.sign(
      { userId, type: 'email-verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return token;
  }

  // Verify email token
  verifyEmailToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'email-verification') {
        return null;
      }
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Generate password reset token
  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash token
  hashToken(token) {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  // Verify Google token
  async verifyGoogleToken(idToken) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      return null;
    }
  }

  // Verify Apple token
  async verifyAppleToken(identityToken) {
    try {
      // Get Apple's public keys
      const client = jwksClient({
        jwksUri: 'https://appleid.apple.com/auth/keys'
      });
      
      // Decode token header to get key id
      const decodedToken = jwt.decode(identityToken, { complete: true });
      if (!decodedToken) return null;
      
      const kid = decodedToken.header.kid;
      
      // Get the signing key
      const key = await new Promise((resolve, reject) => {
        client.getSigningKey(kid, (err, key) => {
          if (err) reject(err);
          else resolve(key.getPublicKey());
        });
      });
      
      // Verify token
      const verified = jwt.verify(identityToken, key, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_CLIENT_ID
      });
      
      return verified;
    } catch (error) {
      console.error('Apple token verification failed:', error);
      return null;
    }
  }

  // Generate 2FA secret
  generate2FASecret(email) {
    const secret = speakeasy.generateSecret({
      name: `SmartChat.ai (${email})`,
      length: 32
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url
    };
  }

  // Generate QR code for 2FA
  async generateQRCode(otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      console.error('QR code generation failed:', error);
      return null;
    }
  }

  // Verify 2FA token
  verify2FAToken(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps tolerance
    });
  }

  // Generate session token
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    const strength = {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      score: 0,
      feedback: []
    };

    if (password.length < minLength) {
      strength.feedback.push(`Password must be at least ${minLength} characters`);
    }

    if (hasUpperCase) strength.score++;
    else strength.feedback.push('Add uppercase letters');

    if (hasLowerCase) strength.score++;
    else strength.feedback.push('Add lowercase letters');

    if (hasNumbers) strength.score++;
    else strength.feedback.push('Add numbers');

    if (hasSpecialChar) strength.score++;
    else strength.feedback.push('Add special characters');

    strength.strength = 
      strength.score <= 1 ? 'weak' :
      strength.score <= 2 ? 'fair' :
      strength.score <= 3 ? 'good' : 'strong';

    return strength;
  }
}

module.exports = new AuthService();