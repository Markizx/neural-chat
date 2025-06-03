import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import { useProject } from '../../contexts/ProjectContext';
import { useChat } from '../../contexts/ChatContext';
import FileManager from './FileManager';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { 
    projects,
    activeProject, 
    files, 
    isLoading, 
    error,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
    addFile,
    deleteFile,
    clearError,
    getProjectWithFiles
  } = useProject();
  
  const { createChat } = useChat();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const prevProjectIdRef = React.useRef(null);

  // ИСПРАВЛЕНО: правильная обработка смены проектов
  useEffect(() => {
    const handleProjectChange = async () => {
      console.log('ProjectView: изменился projectId:', projectId, 'предыдущий:', prevProjectIdRef.current);
      
      // Проверяем, действительно ли изменился проект
      if (projectId === prevProjectIdRef.current) {
        console.log('ProjectView: projectId не изменился, пропускаем загрузку');
        return;
      }
      
      prevProjectIdRef.current = projectId;
      
      if (projectId && projects && projects.length > 0) {
        console.log('ProjectView: ищем проект:', projectId);
        let project = projects.find(p => p.id === projectId);
        
        // ИСПРАВЛЕНО: если проект не найден в списке, пытаемся получить его с файлами
        if (!project) {
          console.log('ProjectView: проект не найден в списке, загружаем с файлами');
          project = await getProjectWithFiles(projectId);
        }
        
        if (project) {
          console.log('ProjectView: устанавливаем активный проект:', project.name || project.title);
          setActiveProject(project);
        } else {
          console.error('ProjectView: проект не найден:', projectId);
          navigate('/'); // Переходим на главную если проект не найден
        }
      } else {
        console.log('ProjectView: очищаем активный проект');
        setActiveProject(null);
      }
    };
    
    handleProjectChange();
  }, [projectId, projects, setActiveProject, getProjectWithFiles, navigate]);

  // Обновление полей редактирования при изменении проекта
  useEffect(() => {
    if (activeProject) {
      console.log('ProjectView: обновляем поля редактирования для проекта:', activeProject.name || activeProject.title);
      setTitle(activeProject.title || activeProject.name || '');
      setDescription(activeProject.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [activeProject]);

  // Обработчик создания чата с контекстом проекта
  const handleCreateChat = async () => {
    if (!activeProject) return;
    
    const chatTitle = `Чат: ${activeProject.title || activeProject.name || 'Проект'}`;
    const newChat = await createChat(chatTitle);
    
    if (newChat && newChat.id) {
      navigate(`/chat/${newChat.id}`);
    }
  };

  // Обработчик обновления проекта
  const handleUpdateProject = async () => {
    if (!activeProject) return;
    
    console.log('ProjectView: обновляем проект:', title);
    
    const result = await updateProject(activeProject.id, {
      title,
      name: title, // Для совместимости
      description,
    });
    
    if (result) {
      setEditDialogOpen(false);
    }
  };

  // Обработчик удаления проекта
  const handleDeleteProject = async () => {
    if (!activeProject) return;
    
    console.log('ProjectView: удаляем проект:', activeProject.name || activeProject.title);
    
    const success = await deleteProject(activeProject.id);
    
    if (success) {
      navigate('/');
    }
    
    setDeleteConfirmOpen(false);
  };

  // Обработчик загрузки файла
  const handleFileUpload = async (file) => {
    if (!activeProject) return;
    
    console.log('ProjectView: загружаем файл:', file.name);
    
    const result = await addFile(file);
    return result;
  };

  // Обработчик удаления файла
  const handleFileRemove = async (fileId) => {
    console.log('ProjectView: удаляем файл:', fileId);
    
    const result = await deleteFile(fileId);
    return result;
  };

  if (!projectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          Выберите проект или создайте новый
        </Typography>
      </Box>
    );
  }

  // ИСПРАВЛЕНО: показываем загрузку только когда действительно загружаем
  if (isLoading && !activeProject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка проекта...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* Заголовок проекта */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h6" noWrap>
            {activeProject ? (activeProject.title || activeProject.name || 'Проект без названия') : 'Загрузка...'}
          </Typography>
          {activeProject && activeProject.description && (
            <Typography variant="body2" color="text.secondary">
              {activeProject.description}
            </Typography>
          )}
          {activeProject && files && (
            <Typography variant="caption" color="text.secondary">
              Файлов: {files.length}
            </Typography>
          )}
        </Box>
        
        <Box>
          <Tooltip title="Создать чат с контекстом проекта">
            <IconButton 
              onClick={handleCreateChat}
              disabled={!activeProject || isLoading}
              sx={{ mr: 1 }}
            >
              <ChatIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Редактировать проект">
            <IconButton 
              onClick={() => setEditDialogOpen(true)}
              disabled={!activeProject || isLoading}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить проект">
            <IconButton 
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={!activeProject || isLoading}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Основное содержимое */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {activeProject ? (
          <Box>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 2, 
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                Файлы проекта
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Эти файлы будут использоваться как контекст при общении с Claude в чатах, связанных с проектом.
              </Typography>
              <FileManager 
                files={files} 
                onUpload={handleFileUpload} 
                onRemove={handleFileRemove}
                loading={isLoading}
              />
            </Paper>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">
              Проект не найден
            </Typography>
          </Box>
        )}
      </Box>

      {/* Показываем ошибки */}
      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ m: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Диалог редактирования проекта */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Редактировать проект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название проекта"
            type="text"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleUpdateProject} 
            variant="contained"
            disabled={!title.trim()}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Удалить проект?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить проект "{activeProject?.title || activeProject?.name || 'Проект без названия'}"? 
            Все файлы проекта будут удалены. Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleDeleteProject} 
            variant="contained" 
            color="error"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectView;