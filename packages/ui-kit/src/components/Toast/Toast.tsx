import React from 'react';
import { Snackbar, Alert, AlertProps, SnackbarProps, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

export interface ToastProps extends Omit<SnackbarProps, 'children'> {
  message: string;
  severity?: AlertProps['severity'];
  variant?: AlertProps['variant'];
  onClose?: () => void;
  action?: React.ReactNode;
  closeButton?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  severity = 'info',
  variant = 'filled',
  onClose,
  action,
  closeButton = true,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  ...snackbarProps
}) => {
  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose?.();
  };

  return (
    <Snackbar
      autoHideDuration={autoHideDuration}
      anchorOrigin={anchorOrigin}
      onClose={handleClose}
      {...snackbarProps}
    >
      <Alert
        severity={severity}
        variant={variant}
        onClose={onClose}
        action={
          <>
            {action}
            {closeButton && !onClose && (
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
              >
                <Close fontSize="small" />
              </IconButton>
            )}
          </>
        }
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

// Toast context for global toast management
interface ToastContextValue {
  showToast: (message: string, options?: Partial<ToastProps>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([]);

  const showToast = React.useCallback((message: string, options?: Partial<ToastProps>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, ...options, open: true }]);
  }, []);

  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default Toast;