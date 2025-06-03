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
import { useTranslation } from '../../hooks/useTranslation';
import { supportedLanguages, syncLanguageWithUserSettings } from '../../i18n';

interface SettingsPanelProps {
  type: 'appearance' | 'notifications' | 'security';
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ type }) => {
  const { user, updateUser } = useAuth();
  const { mode, setMode } = useTheme();
  const { t } = useTranslation();

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiService.put('/user/settings', { settings });
      return response.data;
    },
    onSuccess: (data) => {
      updateUser({ settings: (data as any).settings });
    },
  });

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = {
      ...user?.settings,
      [key]: value,
    };
    
    // Синхронизируем язык немедленно если изменился
    if (key === 'language') {
      syncLanguageWithUserSettings(newSettings);
      // Принудительно обновляем страницу для применения переводов
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    
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
          {t('settings.appearance')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('settings.appearanceDescription', 'Customize how NeuralChat looks and feels')}
        </Typography>

        {/* Theme */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('settings.theme')}
          </Typography>
          <RadioGroup
            value={mode}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
          >
            <FormControlLabel value="light" control={<Radio />} label={t('settings.themes.light')} />
            <FormControlLabel value="dark" control={<Radio />} label={t('settings.themes.dark')} />
            <FormControlLabel value="system" control={<Radio />} label={t('settings.themes.system')} disabled />
          </RadioGroup>
        </Box>

        {/* Language */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.language')}</InputLabel>
            <Select
              value={user?.settings?.language || 'en'}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              label={t('settings.language')}
            >
              {Object.entries(supportedLanguages).map(([code, lang]) => (
                <MenuItem key={code} value={code}>
                  {lang.flag} {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Font Size */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('settings.fontSize')}
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
            <InputLabel>{t('settings.defaultModel')}</InputLabel>
            <Select
              value={user?.settings?.defaultModel || 'claude-4-sonnet'}
              onChange={(e) => handleSettingChange('defaultModel', e.target.value)}
              label={t('settings.defaultModel')}
            >
              <MenuItem value="claude-4-sonnet">Claude 4 Sonnet</MenuItem>
            <MenuItem value="claude-4-opus">Claude 4 Opus</MenuItem>
            <MenuItem value="claude-3.7-sonnet">Claude 3.7 Sonnet</MenuItem>
              <MenuItem value="claude-3-haiku-20240307">Claude 3 Haiku</MenuItem>
              <MenuItem value="grok-2-1212">Grok 2</MenuItem>
              <MenuItem value="grok-2-vision-1212">Grok 2 Vision</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {updateSettingsMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {t('settings.saved')}
          </Alert>
        )}
      </Box>
    );
  }

  if (type === 'notifications') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          {t('settings.notifications')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('settings.notificationsDescription', 'Choose what notifications you want to receive')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.email || true}
                onChange={(e) => handleNotificationChange('email', e.target.checked)}
              />
            }
            label={t('settings.emailNotifications', 'Email Notifications')}
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.push || true}
                onChange={(e) => handleNotificationChange('push', e.target.checked)}
              />
            }
            label={t('settings.pushNotifications', 'Push Notifications')}
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.chatMessages || true}
                onChange={(e) => handleNotificationChange('chatMessages', e.target.checked)}
              />
            }
            label={t('settings.chatNotifications', 'Chat Message Notifications')}
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.brainstormUpdates || true}
                onChange={(e) => handleNotificationChange('brainstormUpdates', e.target.checked)}
              />
            }
            label={t('settings.brainstormNotifications', 'Brainstorm Session Updates')}
          />
          <FormControlLabel
            control={
              <Switch
                checked={user?.settings?.notifications?.marketing || false}
                onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
              />
            }
            label={t('settings.marketingEmails', 'Marketing and Promotional Emails')}
          />
        </Box>

        {updateSettingsMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {t('settings.saved')}
          </Alert>
        )}
      </Box>
    );
  }

  if (type === 'security') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          {t('settings.security')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('settings.securityDescription', 'Keep your account secure')}
        </Typography>

        {/* Change Password */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('settings.password', 'Password')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('settings.passwordDescription', 'Change your password regularly to keep your account secure')}
          </Typography>
          <Button variant="outlined">{t('settings.changePassword', 'Change Password')}</Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Two-Factor Authentication */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('settings.twoFactor', 'Two-Factor Authentication')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('settings.twoFactorDescription', 'Add an extra layer of security to your account')}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={user?.security?.twoFactorEnabled || false}
                disabled
              />
            }
            label={t('settings.enableTwoFactor', 'Enable Two-Factor Authentication')}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {t('common.comingSoon', 'Coming soon')}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Account Deletion */}
        <Box>
          <Typography variant="subtitle1" gutterBottom color="error">
            {t('settings.deleteAccount', 'Delete Account')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('settings.deleteAccountWarning', 'Permanently delete your account and all associated data. This action cannot be undone.')}
          </Typography>
          <Button variant="outlined" color="error">
            {t('settings.deleteAccount', 'Delete Account')}
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default SettingsPanel;