import { useTheme as useMuiTheme, useMediaQuery } from '@mui/material';

export const useTheme = () => {
  const theme = useMuiTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    theme,
    isDarkMode,
    isMobile,
    isTablet,
    isDesktop,
  };
};