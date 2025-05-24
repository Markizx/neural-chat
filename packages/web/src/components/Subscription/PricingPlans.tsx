import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Star,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface PricingPlansProps {
  currentPlan: string;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ currentPlan }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      description: 'Perfect for trying out SmartChat.ai',
      features: [
        { text: '10 messages per day', included: true },
        { text: 'Claude 3.5 Sonnet', included: true },
        { text: 'Grok 2', included: true },
        { text: 'Basic features', included: true },
        { text: 'Projects & file uploads', included: false },
        { text: 'Brainstorm Mode', included: false },
        { text: 'API access', included: false },
      ],
      color: '#6b7280',
      buttonText: 'Current Plan',
      disabled: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      interval: 'month',
      description: 'For power users and professionals',
      features: [
        { text: '100 messages per day', included: true },
        { text: 'All Claude models', included: true },
        { text: 'All Grok models', included: true },
        { text: 'Projects & file uploads', included: true },
        { text: 'Priority support', included: true },
        { text: 'Brainstorm Mode', included: false },
        { text: 'API access', included: false },
      ],
      color: '#667eea',
      popular: true,
      buttonText: currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: currentPlan === 'pro',
    },
    {
      id: 'business',
      name: 'Business',
      price: 49,
      interval: 'month',
      description: 'For teams and businesses',
      features: [
        { text: 'Unlimited messages', included: true },
        { text: 'All AI models', included: true },
        { text: 'Brainstorm Mode', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'API access', included: true },
        { text: 'Premium support', included: true },
        { text: 'Custom integrations', included: true },
      ],
      color: '#764ba2',
      buttonText: currentPlan === 'business' ? 'Current Plan' : 'Upgrade to Business',
      disabled: currentPlan === 'business',
    },
  ];

  const createCheckoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiService.post('/subscription/create-checkout', {
        planId,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return;
    
    setLoadingPlan(planId);
    try {
      await createCheckoutMutation.mutateAsync(planId);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={3} alignItems="stretch">
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderColor: plan.popular ? plan.color : 'divider',
                borderWidth: plan.popular ? 2 : 1,
                borderStyle: 'solid',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: plan.id !== 'free' ? 'translateY(-4px)' : 'none',
                },
              }}
            >
              {plan.popular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  size="small"
                  icon={<Star />}
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: plan.color, fontWeight: 600 }}
                  >
                    {plan.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      ${plan.price}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                      /{plan.interval}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {plan.description}
                  </Typography>
                </Box>

                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {feature.included ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Cancel color="disabled" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.text}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: feature.included ? 'text.primary' : 'text.disabled',
                            fontSize: '0.875rem',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant={plan.id === currentPlan ? 'outlined' : 'contained'}
                  size="large"
                  disabled={plan.disabled || loadingPlan === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  sx={{
                    background:
                      plan.id !== currentPlan && plan.id !== 'free'
                        ? `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`
                        : undefined,
                    '&:hover': {
                      background:
                        plan.id !== currentPlan && plan.id !== 'free'
                          ? `linear-gradient(135deg, ${plan.color}dd 0%, ${plan.color}aa 100%)`
                          : undefined,
                    },
                  }}
                >
                  {loadingPlan === plan.id ? (
                    <CircularProgress size={24} />
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Money back guarantee */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          <CheckCircle sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
          7-day money-back guarantee • Cancel anytime • No questions asked
        </Typography>
      </Box>
    </Box>
  );
};

export default PricingPlans;