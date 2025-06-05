import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  CircularProgress,
  useTheme,
  Button,
  Paper,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import {
  Folder,
  FolderOff,
  MoreVert,
  Edit,
  Archive,
  Delete,
} from '@mui/icons-material';
import AnimatedMessage from './AnimatedMessage';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import EmptyState from './EmptyState';
import ProjectFilesIndicator from './ProjectFilesIndicator';
import { useChat } from '../../hooks/useChat';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useProjects } from '../../hooks/useProjects';
import { useTranslation } from '../../hooks/useTranslation';
import { Chat } from '../../types/api.types';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

interface ChatWindowProps {
  type: 'claude' | 'grok';
  chatId?: string;
  initialChat?: Chat;
  isMobile?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  type, 
  chatId, 
  initialChat, 
  isMobile = false 
}) => {
  const { t } = useTranslation();
  const [projectMenuAnchorEl, setProjectMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModel, setSelectedModel] = useState<string>(
    type === 'claude' ? 'claude-4-sonnet' : 'grok-3'
  );
  const [activeProject, setActiveProject] = useState<string | null>(
    initialChat?.projectId || null
  );
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const messagesContainerRef = useRef<null | HTMLDivElement>(null);
  const { socket } = useWebSocket();
  const theme = useTheme();
  const navigate = useNavigate();
  // const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const { projects, loading: projectsLoading } = useProjects();
  
  const {
    chat,
    messages,
    loading,
    error,
    sendMessage,
    streamingMessage,
    updateChat,
  } = useChat(chatId, initialChat, type, navigate, activeProject || undefined);

  useEffect(() => {
    if (chatId && socket) {
      socket.emit('chat:join', chatId);
      return () => {
        socket.emit('chat:leave', chatId);
      };
    }
  }, [chatId, socket]);

  useEffect(() => {
    // Используем requestAnimationFrame для предотвращения проблем с layout
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 50); // Небольшая задержка для завершения рендеринга
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Отслеживаем новые сообщения для анимации
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && !newMessageIds.has(lastMessage._id)) {
        setNewMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.add(lastMessage._id);
          return newSet;
        });
        // Убираем флаг "новое" через 1 секунду
        setTimeout(() => {
          setNewMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(lastMessage._id);
            return newSet;
          });
        }, 1000);
      }
    }
  }, [messages, newMessageIds]);

  const scrollToBottom = () => {
    // Проверяем, что элемент существует и контейнер готов
    if (messagesEndRef.current && messagesContainerRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      });
    }
  };

  const handleProjectMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProjectMenuAnchorEl(event.currentTarget);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchorEl(null);
  };

  const handleProjectSelect = async (projectId: string | null) => {
    setActiveProject(projectId);
    handleProjectMenuClose();
    
    // Обновляем чат с новым projectId
    if (chatId && chat) {
      try {
        await updateChat(chatId, { projectId });
      } catch (error) {
        console.error('Failed to update chat project:', error);
      }
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    let enhancedContent = content;
    if (activeProject && projects && Array.isArray(projects)) {
      const project = projects.find(p => p._id === activeProject);
      if (project) {
        enhancedContent = `[Контекст проекта: ${project.name}]\n\n${content}`;
      }
    }
    await sendMessage(enhancedContent, attachments);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  if (!chatId) {
    return (
      <Box 
        className="chat-window-full page-content"
        sx={{ 
          height: '100%',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(31,41,55,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
        }}>
        
        {/* Beautiful centered content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: isMobile ? 3 : 6,
            textAlign: 'center',
            minHeight: 0,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: type === 'claude' 
                ? 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.1) 0%, transparent 50%)',
              zIndex: 0,
            },
          }}
        >
          {/* Logo/Icon */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              mb: 4,
              p: 3,
              borderRadius: '24px',
              background: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.8)',
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.05)'}`,
              backdropFilter: 'blur(20px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <Box
              sx={{
                fontSize: isMobile ? '48px' : '64px',
                background: type === 'claude' 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {type === 'claude' ? '🤖' : '🚀'}
            </Box>
          </Box>

          {/* Main content */}
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                background: type === 'claude' 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 2,
              }}
            >
              {type === 'claude' ? 'Поболтай с Claude' : 'Поболтай с Grok'}
            </Typography>
            
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              color="text.secondary"
              sx={{ 
                mb: 4,
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              {type === 'claude' 
                ? 'Умный помощник для любых задач: анализ, код, творчество и многое другое'
                : 'Дерзкий ИИ с чувством юмора для творческих задач и быстрых ответов'
              }
            </Typography>
            
            {/* Model selector with better styling */}
            <Box sx={{ mb: 4 }}>
              <ModelSelector
                currentModel={selectedModel}
                type={type}
                onModelChange={setSelectedModel}
              />
            </Box>

            {/* Quick start suggestions */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'center',
                mb: 4,
              }}
            >
              {(type === 'claude' 
                ? ['💻 Помоги с кодом', '📊 Анализ данных', '✍️ Написать текст', '🔍 Исследование']
                : ['💡 Креативные идеи', '😂 Пошути', '🎨 Творческий контент', '⚡ Быстрый ответ']
              ).map((suggestion, index) => (
                <Box
                  key={index}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0,0,0,0.08)'}`,
                    fontSize: isMobile ? '0.875rem' : '0.9rem',
                    color: 'text.secondary',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.08)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                  onClick={() => handleSendMessage(suggestion.split(' ').slice(1).join(' '))}
                >
                  {suggestion}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        
        {/* Input area with improved styling */}
        <Box 
          sx={{ 
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark'
              ? 'rgba(0,0,0,0.2)'
              : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            flexShrink: 0,
          }}
        >
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={loading}
            placeholder={`Сообщение для ${type === 'claude' ? 'Claude' : 'Grok'}...`}
            chatType={type}
            isMobile={isMobile}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%', // Всегда 100% от родителя
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        position: 'relative',
      }}
    >
      {/* Header - фиксированная высота */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderBottom: 1,
          borderColor: 'divider',
          background: theme.palette.mode === 'dark'
            ? 'rgba(26, 26, 46, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          minHeight: isMobile ? '50px' : '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, minWidth: 0 }}>
            {chat?.title || t('navigation.newChat')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Box>
              <Button
                size="small"
                startIcon={activeProject ? <Folder /> : <FolderOff />}
                onClick={handleProjectMenuOpen}
                sx={{
                  textTransform: 'none',
                  color: activeProject ? 'primary.main' : 'text.secondary',
                }}
              >
                {activeProject && projects && Array.isArray(projects)
                  ? projects.find(p => p._id === activeProject)?.name || t('projects.title')
                  : 'Без проекта'}
              </Button>
              <Menu
                anchorEl={projectMenuAnchorEl}
                open={Boolean(projectMenuAnchorEl)}
                onClose={handleProjectMenuClose}
              >
                <MenuItem onClick={() => handleProjectSelect(null)}>
                  <FolderOff sx={{ mr: 1 }} fontSize="small" />
                  Без проекта
                </MenuItem>
                {projectsLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  projects && Array.isArray(projects) ? projects.map((project) => (
                    <MenuItem
                      key={project._id}
                      onClick={() => handleProjectSelect(project._id)}
                      selected={activeProject === project._id}
                    >
                      <Folder sx={{ mr: 1 }} fontSize="small" />
                      {project.name}
                    </MenuItem>
                  )) : null
                )}
              </Menu>
            </Box>
            
            <ModelSelector
              currentModel={selectedModel}
              type={type}
              onModelChange={setSelectedModel}
              disabled={loading}
            />
          </Box>
        </Box>
      </Paper>

      {/* Messages Area - растягивается */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: { xs: 1, md: 2 },
          py: 1,
          minHeight: 0, // Важно для правильной работы flex
        }}
      >
        {/* Индикатор файлов проекта */}
        {activeProject && projects && Array.isArray(projects) && (
          (() => {
            const project = projects.find(p => p._id === activeProject);
            return project?.files && project.files.length > 0 ? (
              <ProjectFilesIndicator
                projectId={activeProject}
                projectName={project.name}
                files={project.files}
                expanded={true}
              />
            ) : null;
          })()
        )}
        {messages.length === 0 && !streamingMessage ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
            }}
          >
            <EmptyState
              title={`Начните общение с ${type === 'claude' ? 'Claude' : 'Grok'}`}
              subtitle="Задайте любой вопрос или выберите один из предложенных вариантов"
              chatType={type}
              onSuggestionClick={handleSuggestionClick}
            />
          </Box>
        ) : (
          <Box
            ref={messagesContainerRef}
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minHeight: 0, // Важно для правильной работы flex
              maxHeight: '100%',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.text.secondary, 0.3),
                borderRadius: '3px',
                '&:hover': {
                  background: alpha(theme.palette.text.secondary, 0.5),
                },
              },
            }}
          >
            {/* Отображение сообщений */}
            {messages.map((message, index) => (
              <AnimatedMessage
                key={message._id}
                message={message}
                index={index}
                chatType={type}
                isNew={newMessageIds.has(message._id)}
              />
            ))}
            
            {/* Streaming сообщение */}
            {streamingMessage && (
              <AnimatedMessage
                message={{
                  _id: streamingMessage.id,
                  role: 'assistant',
                  content: streamingMessage.content,
                  model: streamingMessage.model,
                  isStreaming: true,
                  createdAt: new Date(),
                }}
                index={messages.length}
                chatType={type}
                isNew={true}
              />
            )}
            
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Input Area - адаптивная высота */}
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          borderTop: 1,
          borderColor: 'divider',
          background: theme.palette.mode === 'dark'
            ? 'rgba(26, 26, 46, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}
      >
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={loading || !!streamingMessage}
          placeholder={`Сообщение для ${type === 'claude' ? 'Claude' : 'Grok'}...`}
          chatType={type}
          isMobile={isMobile}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow;