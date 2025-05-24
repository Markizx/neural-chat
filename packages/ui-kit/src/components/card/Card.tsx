import React, { ReactNode } from 'react';
import { Paper, PaperProps, Box, Typography } from '@mui/material';
import clsx from 'clsx';

export interface CardProps extends Omit<PaperProps, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  footer,
  children,
  noPadding,
  bordered,
  hoverable,
  className,
  elevation = 0,
  ...props
}) => {
  return (
    <Paper
      elevation={elevation}
      className={clsx(
        {
          'hover:shadow-lg transition-shadow': hoverable,
          'border border-gray-200': bordered,
        },
        className
      )}
      {...props}
    >
      {(title || subtitle || actions) && (
        <Box
          sx={{
            p: noPadding ? 0 : 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            {title && (
              <Typography variant="h6" component="div">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Box>
      )}

      <Box sx={{ p: noPadding ? 0 : 2 }}>{children}</Box>

      {footer && (
        <Box
          sx={{
            p: noPadding ? 0 : 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          {footer}
        </Box>
      )}
    </Paper>
  );
};