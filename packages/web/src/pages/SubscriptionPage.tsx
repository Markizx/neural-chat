import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import PricingPlans from '../components/Subscription/PricingPlans';
import SubscriptionStatus from '../components/Subscription/SubscriptionStatus';
import { useAuth } from '../hooks/useAuth';

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const currentPlan = user?.subscription?.plan || 'free';

  // Check for success/cancel params from Stripe
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get('success') === 'true';
  const isCanceled = urlParams.get('canceled') === 'true';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Unlock the full potential of AI with SmartChat.ai
        </Typography>
      </Box>

      {/* Success/Cancel alerts */}
      {isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <CheckCircle sx={{ verticalAlign: 'middle', mr: 1 }} />
            Payment successful! Your subscription has been updated.
          </Typography>
        </Alert>
      )}
      {isCanceled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Payment was canceled. You can try again whenever you're ready.
        </Alert>
      )}

      {/* Current subscription status */}
      <SubscriptionStatus />

      {/* Pricing plans */}
      <PricingPlans currentPlan={currentPlan} />

      {/* FAQ Section */}
      <Paper sx={{ mt: 6, p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Frequently Asked Questions
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Can I change my plan anytime?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
            and we'll prorate any charges or credits.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            What happens to my data if I cancel?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your data remains accessible for 30 days after cancellation. You can export your chats
            and data at any time from your settings.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Do you offer refunds?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            We offer a 7-day money-back guarantee for new subscriptions. Contact support if you're
            not satisfied with SmartChat.ai.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Is my payment information secure?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Absolutely! We use Stripe for payment processing, which is PCI-compliant and uses
            industry-standard encryption. We never store your credit card details.
          </Typography>
        </Box>
      </Paper>

      {/* Contact */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Have questions? Contact us at{' '}
          <a href="mailto:support@smartchat.ai" style={{ color: 'inherit' }}>
            support@smartchat.ai
          </a>
        </Typography>
      </Box>
    </Container>
  );
};

export default SubscriptionPage;