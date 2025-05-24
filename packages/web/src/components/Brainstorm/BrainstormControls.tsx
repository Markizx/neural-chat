import React from 'react';
import {
  Box,
  Paper,
  Button,
  ButtonGroup,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Download,
  Share,
} from '@mui/icons-material';

interface BrainstormControlsProps {
  status: 'active' | 'paused' | 'completed' | 'error';
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

const BrainstormControls: React.FC<BrainstormControlsProps> = ({
  status,
  onPause,
  onResume,
  onStop,
  onExport,
  isLoading = false,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        borderRadius: 0,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <ButtonGroup variant="contained" disabled={isLoading}>
          {status === 'active' ? (
            <Button
              onClick={onPause}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Pause />}
            >
              Pause
            </Button>
          ) : status === 'paused' ? (
            <Button
              onClick={onResume}
              startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrow />}
            >
              Resume
            </Button>
          ) : null}
          
          {status !== 'completed' && (
            <Button
              onClick={onStop}
              color="error"
              startIcon={isLoading ? <CircularProgress size={20} /> : <Stop />}
            >
              Stop
            </Button>
          )}
        </ButtonGroup>

        <ButtonGroup variant="outlined">
          <Button
            onClick={onExport}
            startIcon={<Download />}
          >
            Export
          </Button>
          <Button
            startIcon={<Share />}
            disabled
          >
            Share
          </Button>
        </ButtonGroup>
      </Box>
    </Paper>
  );
};

export default BrainstormControls;