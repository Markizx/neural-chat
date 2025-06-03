import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Button,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ContentCopy,
  Download,
  Code,
  Image as ImageIcon,
  Html,
  PlayArrow,
} from '@mui/icons-material';

interface Artifact {
  id: string;
  type: 'code' | 'react' | 'svg' | 'html' | 'image' | 'generated-image' | 'text' | 'markdown';
  content?: string;
  language?: string;
  title?: string;
  url?: string;
  alt?: string;
  description?: string;
  revisedPrompt?: string;
}

interface ArtifactRendererProps {
  artifacts: Artifact[];
}

const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ artifacts }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const theme = useTheme();

  if (!artifacts || artifacts.length === 0) {
    return null;
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = (artifact: Artifact) => {
    const content = artifact.content || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact-${artifact.id}.${artifact.language || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderArtifact = (artifact: Artifact) => {
    switch (artifact.type) {
      case 'code':
        return (
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
              <Tooltip title="Копировать код">
                <IconButton
                  size="small"
                  onClick={() => handleCopy(artifact.content || '')}
                  sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Скачать файл">
                <IconButton
                  size="small"
                  onClick={() => handleDownload(artifact)}
                  sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', ml: 1 }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              component="pre"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 400,
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            >
              <code>{artifact.content}</code>
            </Box>
          </Box>
        );

      case 'react':
      case 'html':
        return (
          <Box>
            <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<PlayArrow />}
                variant="contained"
                onClick={() => {
                  const w = window.open('', '_blank');
                  if (w) {
                    w.document.write(artifact.content || '');
                  }
                }}
              >
                Предпросмотр
              </Button>
              <IconButton size="small" onClick={() => handleCopy(artifact.content || '')}>
                <ContentCopy />
              </IconButton>
            </Box>
            <Box
              component="pre"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 300,
                fontSize: '13px',
              }}
            >
              <code>{artifact.content}</code>
            </Box>
          </Box>
        );

      case 'svg':
        return (
          <Box>
            <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => handleCopy(artifact.content || '')}>
                <ContentCopy />
              </IconButton>
              <IconButton size="small" onClick={() => handleDownload(artifact)}>
                <Download />
              </IconButton>
            </Box>
            <Box
              sx={{
                bgcolor: 'white',
                p: 2,
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
              }}
              dangerouslySetInnerHTML={{ __html: artifact.content || '' }}
            />
          </Box>
        );

      case 'image':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={artifact.url}
              alt={artifact.alt || 'Generated image'}
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                borderRadius: 8,
              }}
            />
            {artifact.alt && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                {artifact.alt}
              </Typography>
            )}
          </Box>
        );

      case 'generated-image':
        return (
          <Box sx={{ textAlign: 'center' }}>
            {artifact.url ? (
              <>
                <img
                  src={artifact.url}
                  alt={artifact.description || 'Generated image'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    borderRadius: 8,
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  {artifact.description}
                </Typography>
                {artifact.revisedPrompt && (
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                    Улучшенный промпт: {artifact.revisedPrompt}
                  </Typography>
                )}
              </>
            ) : (
              <Box sx={{ p: 3 }}>
                <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Сгенерированное изображение: {artifact.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Изображение будет доступно после генерации
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        {artifacts.length > 1 ? (
          <>
            <Tabs
              value={selectedTab}
              onChange={(_, newValue) => setSelectedTab(newValue)}
              sx={{ mb: 2 }}
            >
              {artifacts.map((artifact, index) => (
                <Tab
                  key={artifact.id}
                  label={`${artifact.type} ${index + 1}`}
                  icon={
                    artifact.type === 'code' ? <Code /> :
                    artifact.type === 'image' || artifact.type === 'generated-image' ? <ImageIcon /> :
                    artifact.type === 'html' || artifact.type === 'react' ? <Html /> :
                    null
                  }
                  iconPosition="start"
                />
              ))}
            </Tabs>
            {renderArtifact(artifacts[selectedTab])}
          </>
        ) : (
          renderArtifact(artifacts[0])
        )}
      </CardContent>
    </Card>
  );
};

export default ArtifactRenderer; 