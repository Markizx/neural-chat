import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Person,
  SmartToy,
  Psychology,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface BrainstormMessageProps {
  message: {
    id: string;
    speaker: 'claude' | 'grok' | 'user';
    content: string;
    timestamp: string;
    tokens?: number;
  };
}

const BrainstormMessage: React.FC<BrainstormMessageProps> = ({ message }) => {
  const getSpeakerInfo = () => {
    switch (message.speaker) {
      case 'claude':
        return {
          name: 'Claude',
          icon: <SmartToy />,
          color: 'primary',
          bgcolor: 'primary.main',
        };
      case 'grok':
        return {
          name: 'Grok',
          icon: <Psychology />,
          color: 'secondary',
          bgcolor: 'secondary.main',
        };
      case 'user':
        return {
          name: 'You',
          icon: <Person />,
          color: 'default',
          bgcolor: 'grey.500',
        };
    }
  };

  const speakerInfo = getSpeakerInfo();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        sx={{
          bgcolor: speakerInfo.bgcolor,
          width: 40,
          height: 40,
        }}
      >
        {speakerInfo.icon}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {speakerInfo.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(message.timestamp), 'HH:mm:ss')}
          </Typography>
          {message.tokens && (
            <Chip
              label={`${message.tokens} tokens`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: message.speaker === 'user' ? 'action.hover' : 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderLeft: 4,
            borderLeftColor: `${speakerInfo.color}.main`,
          }}
        >
          <ReactMarkdown className="markdown-body">
            {message.content}
          </ReactMarkdown>
        </Paper>
      </Box>
    </Box>
  );
};

export default BrainstormMessage;