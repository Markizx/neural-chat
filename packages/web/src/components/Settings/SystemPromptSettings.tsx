import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Save, Psychology, SmartToy } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settings.service';
import { UserSettings } from '@neuralchat/shared/types/user.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prompt-tabpanel-${index}`}
      aria-labelledby={`prompt-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemPromptSettings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [claudePrompt, setClaudePrompt] = useState('');
  const [grokPrompt, setGrokPrompt] = useState('');
  const [claudeRole, setClaudeRole] = useState('Assistant');
  const [grokRole, setGrokRole] = useState('Assistant');
  const [brainstormClaudePrompt, setBrainstormClaudePrompt] = useState('');
  const [brainstormGrokPrompt, setBrainstormGrokPrompt] = useState('');
  const queryClient = useQueryClient();

  // Загрузка настроек
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const result = await settingsService.getUserSettings();
      return result as UserSettings;
    },
  });

  // Обновляем локальное состояние при загрузке данных
  useEffect(() => {
    if (settings) {
      setClaudePrompt(settings.systemPrompts?.claude || '');
      setGrokPrompt(settings.systemPrompts?.grok || '');
      setClaudeRole(settings.aiRoles?.claude || 'Assistant');
      setGrokRole(settings.aiRoles?.grok || 'Assistant');
      setBrainstormClaudePrompt(settings.brainstormPrompts?.claude || '');
      setBrainstormGrokPrompt(settings.brainstormPrompts?.grok || '');
    }
  }, [settings]);

  // Сохранение настроек
  const saveMutation = useMutation({
    mutationFn: async (prompts: any) => {
      return settingsService.updateSystemPrompts(prompts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      systemPrompts: {
        claude: claudePrompt,
        grok: grokPrompt,
      },
      aiRoles: {
        claude: claudeRole,
        grok: grokRole,
      },
      brainstormPrompts: {
        claude: brainstormClaudePrompt,
        grok: brainstormGrokPrompt,
      },
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const defaultPrompts = {
    claude: "Ты Claude - полезный, безопасный и умный ассистент. Отвечай вдумчиво и структурированно.",
    grok: "Ты Grok - остроумный и прямолинейный ассистент. Будь честным, креативным и не бойся высказывать нестандартные мнения.",
    brainstormClaude: "Ты участвуешь в мозговом штурме. Предлагай креативные идеи, развивай концепции и ищи инновационные решения.",
    brainstormGrok: "Ты участвуешь в мозговом штурме. Бросай вызов стандартному мышлению, предлагай радикальные идеи и ищи неочевидные решения."
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Персональные системные промпты
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Настройте поведение AI-ассистентов под ваши потребности. Эти промпты будут применяться ко всем новым чатам.
      </Typography>

      {saveMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Настройки успешно сохранены!
        </Alert>
      )}

      {saveMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка при сохранении настроек
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab 
          icon={<SmartToy />} 
          label="Обычные чаты" 
          iconPosition="start"
        />
        <Tab 
          icon={<Psychology />} 
          label="Brainstorm режим" 
          iconPosition="start"
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Claude системный промпт
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={claudePrompt}
              onChange={(e) => setClaudePrompt(e.target.value)}
              placeholder={defaultPrompts.claude}
              helperText={`${claudePrompt.length}/2000 символов`}
              inputProps={{ maxLength: 2000 }}
            />
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => setClaudePrompt(defaultPrompts.claude)}
            >
              Использовать стандартный
            </Button>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Claude роль ИИ
            </Typography>
            <TextField
              fullWidth
              value={claudeRole}
              onChange={(e) => setClaudeRole(e.target.value)}
              placeholder="Assistant"
              helperText={`${claudeRole.length}/50 символов. Примеры: Assistant, Expert, Teacher, Coach, Friend`}
              inputProps={{ maxLength: 50 }}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Grok системный промпт
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={grokPrompt}
              onChange={(e) => setGrokPrompt(e.target.value)}
              placeholder={defaultPrompts.grok}
              helperText={`${grokPrompt.length}/2000 символов`}
              inputProps={{ maxLength: 2000 }}
            />
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => setGrokPrompt(defaultPrompts.grok)}
            >
              Использовать стандартный
            </Button>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Grok роль ИИ
            </Typography>
            <TextField
              fullWidth
              value={grokRole}
              onChange={(e) => setGrokRole(e.target.value)}
              placeholder="Assistant"
              helperText={`${grokRole.length}/50 символов. Примеры: Assistant, Expert, Teacher, Coach, Friend`}
              inputProps={{ maxLength: 50 }}
            />
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Claude Brainstorm промпт
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={brainstormClaudePrompt}
              onChange={(e) => setBrainstormClaudePrompt(e.target.value)}
              placeholder={defaultPrompts.brainstormClaude}
              helperText={`${brainstormClaudePrompt.length}/2000 символов`}
              inputProps={{ maxLength: 2000 }}
            />
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => setBrainstormClaudePrompt(defaultPrompts.brainstormClaude)}
            >
              Использовать стандартный
            </Button>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Grok Brainstorm промпт
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={brainstormGrokPrompt}
              onChange={(e) => setBrainstormGrokPrompt(e.target.value)}
              placeholder={defaultPrompts.brainstormGrok}
              helperText={`${brainstormGrokPrompt.length}/2000 символов`}
              inputProps={{ maxLength: 2000 }}
            />
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => setBrainstormGrokPrompt(defaultPrompts.brainstormGrok)}
            >
              Использовать стандартный
            </Button>
          </Box>
        </Box>
      </TabPanel>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </Box>
    </Paper>
  );
};

export default SystemPromptSettings; 