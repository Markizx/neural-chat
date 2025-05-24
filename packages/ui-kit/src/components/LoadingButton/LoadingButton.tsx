import React from 'react';
import { LoadingButton as MuiLoadingButton, LoadingButtonProps as MuiLoadingButtonProps } from '@mui/lab';

export interface LoadingButtonProps extends MuiLoadingButtonProps {
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loadingText,
  loading,
  ...props
}) => {
  return (
    <MuiLoadingButton loading={loading} {...props}>
      {loading && loadingText ? loadingText : children}
    </MuiLoadingButton>
  );
};

export default LoadingButton;