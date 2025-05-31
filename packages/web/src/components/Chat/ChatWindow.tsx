import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Folder,
  FolderOff,
} from '@mui/icons-material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import { useChat } from '../../hooks/useChat';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useProjects } from '../../hooks/useProjects';
import { Chat } from '../../types/api.types';

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
  const [projectMenuAnchorEl, setProjectMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModel, setSelectedModel] = useState<string>(
    type === 'claude' ? 'claude-3.7-sonnet' : 'grok-3'
  );
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { socket } = useWebSocket();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const { projects, loading: projectsLoading } = useProjects();
  
  const {
    chat,
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    editMessage,
    regenerateMessage,
    updateChat,
    deleteChat,
    streamingMessage,
  } = useChat(chatId, initialChat, type);

  useEffect(() => {
    if (chatId && socket) {
      socket.emit('chat:join', chatId);
      return () => {
        socket.emit('chat:leave', chatId);
      };
    }
  }, [chatId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProjectMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProjectMenuAnchorEl(event.currentTarget);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchorEl(null);
  };

  const handleProjectSelect = (projectId: string | null) => {
    setActiveProject(projectId);
    handleProjectMenuClose();
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    let enhancedContent = content;
    if (activeProject) {
      const project = projects.find(p => p._id === activeProject);
      if (project) {
        enhancedContent = `[Контекст проекта: ${project.name}]\n\n${content}`;
      }
    }
    await sendMessage(enhancedContent, attachments);
  };

  if (!chatId) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: isMobile ? 2 : 4,
            textAlign: 'center',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                fontSize: isMobile && isSmallMobile ? '1.1rem' : undefined,
              }}
            >
              Начните новый {type === 'claude' ? 'Claude' : 'Grok'} чат
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: isMobile && isSmallMobile ? '0.875rem' : undefined,
                mb: 3,
              }}
            >
              {isMobile 
                ? 'Введите сообщение для начала'
                : 'Введите сообщение для начала нового чата'
              }
            </Typography>
            
            <ModelSelector
              currentModel={selectedModel}
              type={type}
              onModelChange={setSelectedModel}
            />
          </Box>
        </Box>
        
        <Box 
          sx={{ 
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            flexShrink: 0,
          }}
        >
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={loading}
            placeholder={`Начните чат с ${type === 'claude' ? 'Claude' : 'Grok'}...`}
            chatType={type}
            isMobile={isMobile}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {!isMobile && (
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {chat?.title || 'Новый чат'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                  {activeProject
                    ? projects.find(p => p._id === activeProject)?.name || 'Проект'
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
                    projects.map((project) => (
                      <MenuItem
                        key={project._id}
                        onClick={() => handleProjectSelect(project._id)}
                        selected={activeProject === project._id}
                      >
                        <Folder sx={{ mr: 1 }} fontSize="small" />
                        {project.name}
                      </MenuItem>
                    ))
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
        </Box>
      )}

      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <MessageList
          messages={messages}
          loading={loading}
          onDeleteMessage={deleteMessage}
          onEditMessage={editMessage}
          onRegenerateMessage={regenerateMessage}
          isMobile={isMobile}
          streamingMessage={streamingMessage}
        />
        <div ref={messagesEndRef} />
      </Box>

      <Box 
        sx={{ 
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          flexShrink: 0,
        }}
      >
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={loading}
          placeholder={`Сообщение ${type === 'claude' ? 'Claude' : 'Grok'}...`}
          isMobile={isMobile}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow;