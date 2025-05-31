import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerDay: number;
  };
  api: {
    rateLimitRequests: number;
    rateLimitWindow: number;
    maxTokensPerRequest: number;
    enableLogging: boolean;
  };
  security: {
    passwordMinLength: number;
    requireEmailVerification: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    enableTwoFactor: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    sendWelcomeEmails: boolean;
    sendSecurityAlerts: boolean;
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string[];
    cleanupOldFiles: boolean;
    cleanupDays: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'Neural Chat',
      siteDescription: 'AI-powered chat platform',
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerDay: 100
    },
    api: {
      rateLimitRequests: 100,
      rateLimitWindow: 15,
      maxTokensPerRequest: 4000,
      enableLogging: true
    },
    security: {
      passwordMinLength: 8,
      requireEmailVerification: true,
      sessionTimeoutMinutes: 60,
      maxLoginAttempts: 5,
      enableTwoFactor: false
    },
    notifications: {
      emailEnabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      sendWelcomeEmails: true,
      sendSecurityAlerts: true
    },
    storage: {
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx'],
      cleanupOldFiles: true,
      cleanupDays: 30
    }
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка загрузки настроек',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Настройки успешно сохранены',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка сохранения настроек',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    setConfirmDialog({
      open: true,
      title: 'Сброс настроек',
      message: 'Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?',
      onConfirm: () => {
        loadSettings();
        setConfirmDialog({ ...confirmDialog, open: false });
        setSnackbar({
          open: true,
          message: 'Настройки сброшены',
          severity: 'success'
        });
      }
    });
  };

  const testEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings.notifications)
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Тестовое письмо отправлено',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка отправки тестового письма',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArraySetting = (section: keyof SystemSettings, field: string, index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].map((item: string, i: number) => 
          i === index ? value : item
        )
      }
    }));
  };

  const addArrayItem = (section: keyof SystemSettings, field: string, value: string) => {
    if (value.trim()) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: [...(prev[section] as any)[field], value.trim()]
        }
      }));
    }
  };

  const removeArrayItem = (section: keyof SystemSettings, field: string, index: number) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Настройки системы
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetSettings}
          >
            Сбросить
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={loading}
          >
            Сохранить
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Общие" />
          <Tab label="API" />
          <Tab label="Безопасность" />
          <Tab label="Уведомления" />
          <Tab label="Хранилище" />
        </Tabs>

        {/* Общие настройки */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Название сайта"
                value={settings.general.siteName}
                onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Описание сайта"
                value={settings.general.siteDescription}
                onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                  />
                }
                label="Режим обслуживания"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.registrationEnabled}
                    onChange={(e) => updateSettings('general', 'registrationEnabled', e.target.checked)}
                  />
                }
                label="Регистрация разрешена"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Максимум новых пользователей в день"
                value={settings.general.maxUsersPerDay}
                onChange={(e) => updateSettings('general', 'maxUsersPerDay', parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* API настройки */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Лимит запросов"
                value={settings.api.rateLimitRequests}
                onChange={(e) => updateSettings('api', 'rateLimitRequests', parseInt(e.target.value))}
                helperText="Количество запросов в окне времени"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Окно времени (минуты)"
                value={settings.api.rateLimitWindow}
                onChange={(e) => updateSettings('api', 'rateLimitWindow', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Максимум токенов на запрос"
                value={settings.api.maxTokensPerRequest}
                onChange={(e) => updateSettings('api', 'maxTokensPerRequest', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.api.enableLogging}
                    onChange={(e) => updateSettings('api', 'enableLogging', e.target.checked)}
                  />
                }
                label="Включить логирование API"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Настройки безопасности */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Минимальная длина пароля: {settings.security.passwordMinLength}
              </Typography>
              <Slider
                value={settings.security.passwordMinLength}
                onChange={(_, value) => updateSettings('security', 'passwordMinLength', value as number)}
                min={6}
                max={20}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Таймаут сессии (минуты)"
                value={settings.security.sessionTimeoutMinutes}
                onChange={(e) => updateSettings('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Максимум попыток входа"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.requireEmailVerification}
                    onChange={(e) => updateSettings('security', 'requireEmailVerification', e.target.checked)}
                  />
                }
                label="Требовать подтверждение email"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.enableTwoFactor}
                    onChange={(e) => updateSettings('security', 'enableTwoFactor', e.target.checked)}
                  />
                }
                label="Включить двухфакторную аутентификацию"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Настройки уведомлений */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) => updateSettings('notifications', 'emailEnabled', e.target.checked)}
                  />
                }
                label="Включить email уведомления"
              />
            </Grid>
            {settings.notifications.emailEnabled && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SMTP хост"
                    value={settings.notifications.smtpHost}
                    onChange={(e) => updateSettings('notifications', 'smtpHost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="SMTP порт"
                    value={settings.notifications.smtpPort}
                    onChange={(e) => updateSettings('notifications', 'smtpPort', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SMTP пользователь"
                    value={settings.notifications.smtpUser}
                    onChange={(e) => updateSettings('notifications', 'smtpUser', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="SMTP пароль"
                    value={settings.notifications.smtpPassword}
                    onChange={(e) => updateSettings('notifications', 'smtpPassword', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.sendWelcomeEmails}
                        onChange={(e) => updateSettings('notifications', 'sendWelcomeEmails', e.target.checked)}
                      />
                    }
                    label="Отправлять приветственные письма"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.sendSecurityAlerts}
                        onChange={(e) => updateSettings('notifications', 'sendSecurityAlerts', e.target.checked)}
                      />
                    }
                    label="Отправлять уведомления безопасности"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={testEmailSettings}
                    disabled={loading}
                  >
                    Отправить тестовое письмо
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Настройки хранилища */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Максимальный размер файла (МБ)"
                value={settings.storage.maxFileSize}
                onChange={(e) => updateSettings('storage', 'maxFileSize', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Удалять файлы старше (дней)"
                value={settings.storage.cleanupDays}
                onChange={(e) => updateSettings('storage', 'cleanupDays', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.storage.cleanupOldFiles}
                    onChange={(e) => updateSettings('storage', 'cleanupOldFiles', e.target.checked)}
                  />
                }
                label="Автоматически удалять старые файлы"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Разрешенные типы файлов
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {settings.storage.allowedFileTypes.map((type, index) => (
                  <Chip
                    key={index}
                    label={type}
                    onDelete={() => removeArrayItem('storage', 'allowedFileTypes', index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <TextField
                placeholder="Добавить тип файла (например: mp4)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem('storage', 'allowedFileTypes', (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                        addArrayItem('storage', 'allowedFileTypes', input.value);
                        input.value = '';
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Диалог подтверждения */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Отмена
          </Button>
          <Button color="primary" onClick={confirmDialog.onConfirm}>
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage; 