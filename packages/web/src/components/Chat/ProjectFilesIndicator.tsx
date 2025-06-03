import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Folder,
  ExpandMore,
  ExpandLess,
  InsertDriveFile,
  Image,
  Code,
  Description,
  PictureAsPdf,
} from '@mui/icons-material';

interface ProjectFilesIndicatorProps {
  projectId?: string;
  projectName?: string;
  files: any[];
  expanded?: boolean;
  onToggle?: () => void;
}

const ProjectFilesIndicator: React.FC<ProjectFilesIndicatorProps> = ({
  projectId,
  projectName,
  files,
  expanded = false,
  onToggle,
}) => {
  const getFileIcon = (file: any) => {
    const type = file.type || file.mimeType || '';
    const name = file.name?.toLowerCase() || '';

    if (type.startsWith('image/')) return <Image fontSize="small" color="primary" />;
    if (type.includes('pdf')) return <PictureAsPdf fontSize="small" color="error" />;
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return <Description fontSize="small" color="info" />;
    if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css') || 
        name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.tsx') ||
        name.endsWith('.py') || name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.json')) {
      return <Code fontSize="small" color="success" />;
    }
    return <InsertDriveFile fontSize="small" color="action" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!files || files.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'success.light',
        border: '1px solid',
        borderColor: 'success.main',
        opacity: 0.9,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: onToggle ? 'pointer' : 'default',
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Folder fontSize="small" color="success" />
          <Typography variant="caption" color="success.dark" sx={{ fontWeight: 'bold' }}>
            📁 Контекст проекта: {projectName || 'Проект'} ({files.length} файлов)
          </Typography>
        </Box>
        {onToggle && (
          <IconButton size="small" color="success">
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {onToggle && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {files.map((file, index) => (
              <Tooltip
                key={file.id || index}
                title={`${file.name} (${formatFileSize(file.size)})`}
                arrow
              >
                <Chip
                  icon={getFileIcon(file)}
                  label={file.name}
                  variant="outlined"
                  color="success"
                  size="small"
                  sx={{
                    maxWidth: 200,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Collapse>
      )}

      {!onToggle && (
        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {files.slice(0, 3).map((file, index) => (
            <Tooltip
              key={file.id || index}
              title={`${file.name} (${formatFileSize(file.size)})`}
              arrow
            >
              <Chip
                icon={getFileIcon(file)}
                label={file.name}
                variant="outlined"
                color="success"
                size="small"
                sx={{
                  maxWidth: 150,
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            </Tooltip>
          ))}
          {files.length > 3 && (
            <Chip
              label={`+${files.length - 3} еще`}
              variant="outlined"
              color="success"
              size="small"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProjectFilesIndicator; 