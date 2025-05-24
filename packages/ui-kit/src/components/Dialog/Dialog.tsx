import React from 'react';
import {
  Dialog as MuiDialog,
  DialogProps as MuiDialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';

export interface DialogProps extends Omit<MuiDialogProps, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  dividers?: boolean;
  loading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  title,
  subtitle,
  actions,
  showCloseButton = true,
  onClose,
  children,
  dividers = false,
  loading = false,
  maxWidth = 'sm',
  fullWidth = true,
  ...props
}) => {
  return (
    <MuiDialog
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      onClose={onClose}
      {...props}
    >
      {(title || showCloseButton) && (
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              {typeof title === 'string' ? (
                <Typography variant="h6" component="div">
                  {title}
                </Typography>
              ) : (
                title
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {showCloseButton && onClose && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                size="small"
                sx={{ ml: 2 }}
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}
      
      <DialogContent dividers={dividers}>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : (
          children
        )}
      </DialogContent>
      
      {actions && <DialogActions>{actions}</DialogActions>}
    </MuiDialog>
  );
};

export default Dialog;