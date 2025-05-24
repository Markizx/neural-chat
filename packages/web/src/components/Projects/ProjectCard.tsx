import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  MoreVert,
  Folder,
  Edit,
  Delete,
  Archive,
  InsertDriveFile,
  People,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { Project } from '../../types';
import FileUpload from './FileUpload';

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description || '');

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const response = await apiService.put(`/projects/${project._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      onUpdate();
      setEditDialogOpen(false);
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiService.delete(`/projects/${project._id}`);
    },
    onSuccess: () => {
      onUpdate();
    },
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate();
    }
  };

  const handleUpdateProject = () => {
    if (editName.trim()) {
      updateMutation.mutate({
        name: editName.trim(),
        description: editDescription.trim(),
      });
    }
  };

  const handleFilesClick = () => {
    handleMenuClose();
    setFileDialogOpen(true);
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 3,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: project.color || 'primary.main',
                color: 'white',
                mr: 2,
              }}
            >
              <Folder />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" noWrap>
                {project.name}
              </Typography>
              {project.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {project.description}
                </Typography>
              )}
            </Box>
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<InsertDriveFile />}
              label={`${project.stats.fileCount} files`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<People />}
              label={`${project.collaborators?.length || 0} collaborators`}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>

        <CardActions>
          <Button size="small" onClick={handleFilesClick}>
            Manage Files
          </Button>
          <Button size="small" disabled>
            Settings
          </Button>
        </CardActions>
      </Card>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleFilesClick}>
          <InsertDriveFile fontSize="small" sx={{ mr: 1 }} />
          Files
        </MenuItem>
        <MenuItem disabled>
          <Archive fontSize="small" sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateProject}
            variant="contained"
            disabled={!editName.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* File upload dialog */}
      <Dialog
        open={fileDialogOpen}
        onClose={() => setFileDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Project Files</DialogTitle>
        <DialogContent>
          <FileUpload
            projectId={project._id}
            existingFiles={project.files}
            onUpdate={() => {
              onUpdate();
              setFileDialogOpen(false);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectCard;