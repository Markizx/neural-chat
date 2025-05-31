import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Chip,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  KeyboardArrowDown,
  AutoAwesome,
  Speed,
  Psychology,
  Visibility,
  Star,
} from '@mui/icons-material';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  icon: React.ReactNode;
  badge?: string;
  isNew?: boolean;
  hint?: string;
  isPremium: boolean;
  requiresSubscription?: string;
}

interface ModelSelectorProps {
  currentModel: string;
  type: 'claude' | 'grok';
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  type,
  onModelChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const models: Record<'claude' | 'grok', ModelOption[]> = {
    claude: [
      {
        id: 'claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        description: 'Актуальная и сбалансированная модель',
        capabilities: ['text', 'vision', 'code'],
        icon: <Speed sx={{ color: '#3b82f6' }} />,
        isPremium: false,
        isNew: false,
      },
      {
        id: 'claude-4-sonnet',
        name: 'Claude 4 Sonnet',
        description: 'Новейшая и самая умная модель',
        capabilities: ['text', 'vision', 'code', 'artifacts'],
        icon: <AutoAwesome sx={{ color: '#8b5cf6' }} />,
        badge: 'Новинка',
        isNew: true,
        isPremium: false,
      },
      {
        id: 'claude-4-opus',
        name: 'Claude 4 Opus',
        description: 'Максимальные возможности для сложных задач',
        capabilities: ['text', 'vision', 'code', 'artifacts', 'analysis'],
        icon: <Star sx={{ color: '#f59e0b' }} />,
        badge: 'Премиум',
        isPremium: true,
        requiresSubscription: 'max',
        isNew: false,
      },
    ],
    grok: [
      {
        id: 'grok-3',
        name: 'Grok 3',
        description: 'Основная текстовая модель',
        capabilities: ['text', 'code'],
        icon: <Psychology sx={{ color: '#ec4899' }} />,
        isPremium: false,
        isNew: false,
        hint: 'Автоматически переключится на vision/image модель при необходимости'
      },
      {
        id: 'grok-2-vision-1212',
        name: 'Grok 2 Vision',
        description: 'Понимание изображений',
        capabilities: ['text', 'vision'],
        icon: <Visibility sx={{ color: '#10b981' }} />,
        isPremium: false,
        isNew: false,
      },
      {
        id: 'grok-2-image-1212',
        name: 'Grok 2 Image',
        description: 'Генерация изображений',
        capabilities: ['text', 'image-generation'],
        icon: <AutoAwesome sx={{ color: '#f59e0b' }} />,
        isPremium: false,
        isNew: false,
      },
    ],
  };

  const currentModelData = (models[type] as ModelOption[]).find(m => m.id === currentModel) || models[type][0];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    handleClose();
  };

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={handleClick}
        disabled={disabled}
        endIcon={<KeyboardArrowDown />}
        sx={{
          borderColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.12)',
          background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.8)',
          color: theme.palette.mode === 'dark' ? 'white' : '#374151',
          borderRadius: '12px',
          px: 2,
          py: 1,
          minWidth: '200px',
          justifyContent: 'space-between',
          textTransform: 'none',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(139, 92, 246, 0.5)'
              : 'rgba(139, 92, 246, 0.3)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.9)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {currentModelData.icon}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {currentModelData.name}
          </Typography>
          {currentModelData.isNew && (
            <Chip
              label="NEW"
              size="small"
              sx={{
                height: '18px',
                fontSize: '10px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                color: 'white',
              }}
            />
          )}
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: '320px',
            borderRadius: '16px',
            background: theme.palette.mode === 'dark'
              ? 'rgba(20, 20, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)'
            }`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.7)'
                : '#6b7280',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '11px',
            }}
          >
            Выберите модель {type === 'claude' ? 'Claude' : 'Grok'}
          </Typography>
        </Box>
        
        {models[type].map((model, index) => (
          <React.Fragment key={model.id}>
            <MenuItem
              onClick={() => handleModelSelect(model.id)}
              selected={model.id === currentModel}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: '12px',
                minHeight: '80px',
                alignItems: 'flex-start',
                py: 2,
                px: 2,
                background: model.id === currentModel
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(139, 92, 246, 0.08)'
                  : 'transparent',
                border: model.id === currentModel
                  ? `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'rgba(139, 92, 246, 0.2)'
                  }`
                  : '1px solid transparent',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px', mt: 0.5 }}>
                {model.icon}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? 'white' : '#1a1a1a',
                      }}
                    >
                      {model.name}
                    </Typography>
                    {model.isNew && (
                      <Chip
                        label={model.badge || "NEW"}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                          color: 'white',
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.6)'
                          : '#6b7280',
                        mb: 1,
                        fontSize: '13px',
                      }}
                    >
                      {model.description}
                    </Typography>
                    {model.hint && (
                      <Box
                        component="span"
                        sx={{
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.4)'
                            : '#9ca3af',
                          fontSize: '11px',
                          fontStyle: 'italic',
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        💡 {model.hint}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {model.capabilities.slice(0, 3).map((capability) => (
                        <Chip
                          key={capability}
                          label={capability}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: '18px',
                            fontSize: '10px',
                            borderColor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'rgba(0, 0, 0, 0.12)',
                            color: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.7)'
                              : '#6b7280',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                }
              />
            </MenuItem>
            {index < models[type].length - 1 && (
              <Divider sx={{ mx: 2, opacity: 0.1 }} />
            )}
          </React.Fragment>
        ))}
      </Menu>
    </Box>
  );
};

export default ModelSelector; 