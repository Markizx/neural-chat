import React from 'react';
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps, styled } from '@mui/material';

export interface TooltipProps extends Omit<MuiTooltipProps, 'arrow'> {
  variant?: 'dark' | 'light' | 'default';
  arrow?: boolean;
}

const StyledTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))<{ variant?: string }>(({ theme, variant }) => {
  if (variant === 'dark') {
    return {
      '& .MuiTooltip-tooltip': {
        backgroundColor: theme.palette.grey[900],
        color: theme.palette.common.white,
        fontSize: '0.75rem',
        fontWeight: 500,
        '& .MuiTooltip-arrow': {
          color: theme.palette.grey[900],
        },
      },
    };
  }

  if (variant === 'light') {
    return {
      '& .MuiTooltip-tooltip': {
        backgroundColor: theme.palette.common.white,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4],
        fontSize: '0.75rem',
        '& .MuiTooltip-arrow': {
          color: theme.palette.common.white,
          '&::before': {
            boxShadow: theme.shadows[2],
          },
        },
      },
    };
  }

  return {};
});

export const Tooltip: React.FC<TooltipProps> = ({
  variant = 'default',
  arrow = true,
  children,
  ...props
}) => {
  if (variant === 'default') {
    return (
      <MuiTooltip arrow={arrow} {...props}>
        {children}
      </MuiTooltip>
    );
  }

  return (
    <StyledTooltip variant={variant} arrow={arrow} {...props}>
      {children}
    </StyledTooltip>
  );
};

export default Tooltip;