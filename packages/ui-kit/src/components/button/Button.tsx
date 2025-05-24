import React, { forwardRef } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import clsx from 'clsx';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost' | 'link';
  loading?: boolean;
  rounded?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, rounded, children, disabled, className, ...props }, ref) => {
    const getMuiVariant = (): MuiButtonProps['variant'] => {
      switch (variant) {
        case 'ghost':
        case 'link':
          return 'text';
        default:
          return 'contained';
      }
    };

    const getColor = (): MuiButtonProps['color'] => {
      switch (variant) {
        case 'primary':
          return 'primary';
        case 'secondary':
          return 'secondary';
        case 'success':
          return 'success';
        case 'error':
          return 'error';
        case 'warning':
          return 'warning';
        default:
          return 'primary';
      }
    };

    return (
      <MuiButton
        ref={ref}
        variant={getMuiVariant()}
        color={getColor()}
        disabled={disabled || loading}
        className={clsx(
          {
            'rounded-full': rounded,
            'underline': variant === 'link',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            {children}
          </>
        ) : (
          children
        )}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';