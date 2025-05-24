import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Download,
  Fullscreen,
  Code as CodeIcon,
} from '@mui/icons-material';
import CodeArtifact from './CodeArtifact';
import ReactArtifact from './ReactArtifact';
import { Artifact } from '../../types';

interface ArtifactViewerProps {
  artifact: Artifact;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact }) => {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title || 'artifact'}.${getFileExtension()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileExtension = () => {
    switch (artifact.type) {
      case 'code':
        return artifact.language || 'txt';
      case 'markdown':
        return 'md';
      case 'react':
        return 'jsx';
      case 'svg':
        return 'svg';
      case 'html':
        return 'html';
      case 'mermaid':
        return 'mmd';
      default:
        return 'txt';
    }
  };

  const renderContent = () => {
    switch (artifact.type) {
      case 'code':
        return <CodeArtifact artifact={artifact} />;
      case 'react':
        return (
          <Box>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Preview" />
              <Tab label="Code" />
            </Tabs>
            {activeTab === 0 ? (
              <ReactArtifact artifact={artifact} />
            ) : (
              <CodeArtifact artifact={{ ...artifact, language: 'jsx' }} />
            )}
          </Box>
        );
      case 'markdown':
        return <CodeArtifact artifact={{ ...artifact, language: 'markdown' }} />;
      case 'html':
        return (
          <Box>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Preview" />
              <Tab label="Code" />
            </Tabs>
            {activeTab === 0 ? (
              <Box
                sx={{
                  p: 2,
                  '& iframe': {
                    width: '100%',
                    height: '400px',
                    border: 'none',
                  },
                }}
                dangerouslySetInnerHTML={{
                  __html: `<iframe srcdoc="${artifact.content.replace(/"/g, '&quot;')}"></iframe>`,
                }}
              />
            ) : (
              <CodeArtifact artifact={{ ...artifact, language: 'html' }} />
            )}
          </Box>
        );
      case 'svg':
        return (
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              '& svg': {
                maxWidth: '100%',
                height: 'auto',
              },
            }}
            dangerouslySetInnerHTML={{ __html: artifact.content }}
          />
        );
      default:
        return (
          <Typography variant="body2" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
            {artifact.content}
          </Typography>
        );
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'action.hover',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon fontSize="small" />
          <Typography variant="subtitle2">
            {artifact.title || `${artifact.type} artifact`}
          </Typography>
          {artifact.language && (
            <Typography variant="caption" color="text.secondary">
              ({artifact.language})
            </Typography>
          )}
        </Box>
        
        <Box>
          <Tooltip title="Copy">
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton size="small" disabled>
              <Fullscreen fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
          {renderContent()}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ArtifactViewer;