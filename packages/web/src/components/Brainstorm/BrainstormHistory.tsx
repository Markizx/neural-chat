import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Delete,
  MoreVert,
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brainstormService, BrainstormSession, BrainstormSessionsResponse } from '../../services/brainstorm.service';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BrainstormHistoryProps {
  onSelectSession: (sessionId: string) => void;
}

const BrainstormHistory: React.FC<BrainstormHistoryProps> = ({ onSelectSession }) => {
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessionsData, isLoading, error } = useQuery<BrainstormSessionsResponse>({
    queryKey: ['brainstorm-sessions'],
    queryFn: async () => {
      const response = await brainstormService.getSessions();
      return response;
    },
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await brainstormService.deleteSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-sessions'] });
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSessionId(null);
  };

  const handleDeleteClick = () => {
    if (selectedSessionId) {
      setSessionToDelete(selectedSessionId);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      deleteMutation.mutate(sessionToDelete);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayArrow color="success" />;
      case 'paused':
        return <Pause color="warning" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Stop color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Ошибка загрузки истории сессий
      </Alert>
    );
  }

  const sessions = sessionsData?.sessions || [];

  if (sessions.length === 0) {
    return (
      <Box
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(15,15,35,0.5) 0%, rgba(26,26,46,0.3) 50%, rgba(22,33,62,0.5) 100%)'
            : 'linear-gradient(135deg, rgba(248,250,252,0.5) 0%, rgba(226,232,240,0.3) 50%, rgba(203,213,225,0.5) 100%)',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 24, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            🧠 История Brainstorm сессий
          </Typography>
        </Paper>
        
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Box
            sx={{
              mb: 4,
              opacity: 0.7,
              fontSize: '4rem',
            }}
          >
            🤖
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Нет сохраненных сессий
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Создайте первую brainstorm сессию для начала работы с ИИ
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(15,15,35,0.5) 0%, rgba(26,26,46,0.3) 50%, rgba(22,33,62,0.5) 100%)'
          : 'linear-gradient(135deg, rgba(248,250,252,0.5) 0%, rgba(226,232,240,0.3) 50%, rgba(203,213,225,0.5) 100%)',
        minHeight: '100vh',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          background: theme.palette.mode === 'dark'
            ? 'rgba(18, 18, 24, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          🧠 История Brainstorm сессий
        </Typography>
      </Paper>
      
              <List sx={{ p: 2 }}>
        {sessions.map((session: BrainstormSession) => (
          <ListItem
            key={session._id}
            component={Paper}
            elevation={theme.palette.mode === 'dark' ? 2 : 1}
            sx={{ 
              mb: 2, 
              mx: 2, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              borderRadius: '16px',
              background: theme.palette.mode === 'dark'
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(129,140,248,0.2)'
                  : '0 8px 32px rgba(102,126,234,0.15)',
                background: theme.palette.mode === 'dark'
                  ? 'rgba(30, 41, 59, 0.95)'
                  : 'rgba(255, 255, 255, 1)',
              },
            }}
            onClick={() => onSelectSession(session._id)}
          >
            <Box sx={{ mr: 2 }}>
              {getStatusIcon(session.status)}
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography 
                  variant="subtitle1" 
                  noWrap
                  sx={{ 
                    fontWeight: 600, 
                    flex: 1
                  }}
                >
                  {session.topic}
                </Typography>
                <Chip
                  label={session.status}
                  size="small"
                  color={getStatusColor(session.status) as any}
                  variant="outlined"
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ход {session.currentTurn} / {session.maxTurns || session.settings?.maxTurns || 10} • {session.totalTokens} токенов
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(session.updatedAt || session.createdAt), { 
                    addSuffix: true, 
                    locale: ru 
                  })}
                </Typography>
              </Box>
            </Box>
            
            <Box>
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuOpen(e, session._id);
                }}
              >
                <MoreVert />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteClick}>
          <Delete sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить сессию?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить эту brainstorm сессию? 
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrainstormHistory; 