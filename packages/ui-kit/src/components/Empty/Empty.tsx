import React, { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox } from '@mui/icons-material';

export interface EmptyProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  image?: string;
}

export const Empty: React.FC<EmptyProps> = ({
  icon = <Inbox sx={{ fontSize: 64 }} />,
  title = 'No data',
  description,
  action,
  image,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center',
      }}
    >
      {image ? (
        <Box
          component="img"
          src={image}
          alt="Empty state"
          sx={{ width: 200, height: 200, mb: 3, opacity: 0.6 }}
        />
      ) : (
        <Box sx={{ color: 'text.disabled', mb: 2 }}>{icon}</Box>
      )}

      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          {description}
        </Typography>
      )}

      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
};