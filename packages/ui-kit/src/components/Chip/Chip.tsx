import React from 'react';
import { Chip as MuiChip, ChipProps as MuiChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ChipProps extends Omit<MuiChipProps, 'variant'> {
  variant?: 'filled' | 'outlined' | 'soft';
  rounded?: boolean;
}

const StyledChip = styled(MuiChip)<{ customVariant?: string }>(({ theme, customVariant, color }) => {
  if (customVariant === 'soft') {
    const getColor = () => {
      switch (color) {
        case 'primary':
          return theme.palette.primary.main;
        case 'secondary':
          return theme.palette.secondary.main;
        case 'success':
          return theme.palette.success.main;
        case 'error':
          return theme.palette.error.main;
        case 'warning':
          return theme.palette.warning.main;
        case 'info':
          return theme.palette.info.main;
        default:
          return theme.palette.grey[700];
      }
    };

    const mainColor = getColor();

    return {
      backgroundColor: `${mainColor}20`,
      color: mainColor,
      border: 'none',
      '&:hover': {
        backgroundColor: `${mainColor}30`,
      },
      '& .MuiChip-deleteIcon': {
        color: mainColor,
        '&:hover': {
          color: theme.palette.mode === 'dark' 
            ? theme.palette.common.white 
            : theme.palette.common.black,
        },
      },
    };
  }
  return {};
});

export const Chip: React.FC<ChipProps> = ({
  variant = 'filled',
  rounded = false,
  sx,
  ...props
}) => {
  const muiVariant = variant === 'soft' ? 'filled' : variant;

  return (
    <StyledChip
      {...props}
      variant={muiVariant as 'filled' | 'outlined'}
      customVariant={variant}
      sx={{
        borderRadius: rounded ? '9999px' : undefined,
        ...sx,
      }}
    />
  );
};

export default Chip;