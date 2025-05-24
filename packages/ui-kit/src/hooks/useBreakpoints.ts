import { useTheme, useMediaQuery, Breakpoint } from '@mui/material';

export const useBreakpoint = () => {
  const theme = useTheme();

  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const sm = useMediaQuery(theme.breakpoints.only('sm'));
  const md = useMediaQuery(theme.breakpoints.only('md'));
  const lg = useMediaQuery(theme.breakpoints.only('lg'));
  const xl = useMediaQuery(theme.breakpoints.only('xl'));

  const xsUp = useMediaQuery(theme.breakpoints.up('xs'));
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const xlUp = useMediaQuery(theme.breakpoints.up('xl'));

  const xsDown = useMediaQuery(theme.breakpoints.down('xs'));
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const xlDown = useMediaQuery(theme.breakpoints.down('xl'));

  const current: Breakpoint = 
    xs ? 'xs' : sm ? 'sm' : md ? 'md' : lg ? 'lg' : 'xl';

  return {
    // Exact breakpoints
    xs,
    sm,
    md,
    lg,
    xl,
    // Up breakpoints
    xsUp,
    smUp,
    mdUp,
    lgUp,
    xlUp,
    // Down breakpoints
    xsDown,
    smDown,
    mdDown,
    lgDown,
    xlDown,
    // Current breakpoint
    current,
    // Helper methods
    isDesktop: lgUp,
    isTablet: md,
    isMobile: smDown,
  };
};