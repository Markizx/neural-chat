import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Divider,
  Button,
  Alert,
  RadioGroup,
  Radio,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';

interface SettingsPanelProps {
  type: 'appearance' | 'notifications' | 'security';
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ type }) => {
  const { user, updateUser } = useAuth();
  const { mode, setMode } = useTheme();

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiService.put('/user/settings', { settings });
      return response.data;
    },
    onSuccess: (data) => {
      updateUser({ settings: data.settings });
    },
  });

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = {
      ...user?.settings,
      [key]: value,
    };
    updateSettingsMutation.mutate(newSettings);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    const newSettings = {
      ...user?.settings,
      notifications: {
        ...user?.settings?.notifications,
        [key]: value,
      },
    };
    updateSettingsMutation.mutate(newSettings);
  };

  if (type === 'appearance') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Appearance Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Customize how SmartChat.ai looks and feels
        </Typography>

        {/* Theme */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Theme
          </Typography>
          <RadioGroup
            value={mode}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
          >
            <FormControlLabel value="light" control={<Radio />} label="Light" />
            <FormControlLabel value="dark" control={<Radio />} label="Dark" />
            <FormControlLabel value="system" control={<Radio />} label="System" disabled />
          </RadioGroup>
        </Box>

        {/* Language */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              value={user?.settings?.language || 'en'}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              label="Language"
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ru">Русский</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
              <MenuItem value="zh">中文</MenuItem>
              <MenuItem value="ja">日本語</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Font Size */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Font Size
          </Typography>
          <Slider
            value={user?.settings?.fontSize || 14}
            onChange={(_, value) => handleSettingChange('fontSize', value)}
            min={12}
            max={20}
            marks
            valueLabelDisplay="auto"
          />
        </Box>

        {/* Default Model */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Default AI Model</InputLabel>
            <Select
              value={user?.settings?.defaultModel || 'claude-3.5-sonnet'}
              onChange={(e) => handleSettingChange('defaultModel', e.target.value)}
              label="Default AI Model"
            >
              <MenuItem value="claude-4-opus">Claude 4 Opus</MenuItem>
              <MenuItem value="claude-4-sonnet">Claude 4 Sonnet</MenuItem>
              <MenuItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</MenuItem>
              <MenuItem value="grok-3">Grok 3</MenuItem>
              <MenuItem value="grok-2">Grok 2</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    );
  }

  if (type === 'notifications') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Notification Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose what notifications you want to receive
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.email || true}
                onChange={(e) => handleNotificationChange('email', e.target.checked)}
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.push || true}
                onChange={(e) => handleNotificationChange('push', e.target.checked)}
              />
            }
            label="Push Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.chatMessages || true}
                onChange={(e) => handleNotificationChange('chatMessages', e.target.checked)}
              />
            }
            label="Chat Message Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.brainstormUpdates || true}
                onChange={(e) => handleNotificationChange('brainstormUpdates', e.target.checked)}
              />
            }
            label="Brainstorm Session Updates"
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.marketing || false}
                onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
              />
            }
            label="Marketing and Promotional Emails"
          />
        </Box>

        {updateSettingsMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Notification settings updated
          </Alert>
        )}
      </Box>
    );
  }

  if (type === 'security') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Security Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Keep your account secure
        </Typography>

        {/* Change Password */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Password
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Change your password regularly to keep your account secure
          </Typography>
          <Button variant="outlined">Change Password</Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Two-Factor Authentication */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add an extra layer of security to your account
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={user?.security?.twoFactorEnabled || false}
                disabled
              />
            }
            label="Enable Two-Factor Authentication"
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Coming soon
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Account Deletion */}
        <Box>
          <Typography variant="subtitle1" gutterBottom color="error">
            Delete Account
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Typography>
          <Button variant="outlined" color="error">
            Delete Account
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default SettingsPanel;