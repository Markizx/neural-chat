import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

// Define custom theme colors based on your design examples
export const brandColors = {
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ec4899',
    light: '#f472b6',
    dark: '#db2777',
    contrastText: '#ffffff',
  },
  claude: {
    main: '#667eea',
    light: '#7c96f3',
    dark: '#5158d6',
  },
  grok: {
    main: '#764ba2',
    light: '#8e68b8',
    dark: '#5e3a82',
  },
  neon: {
    cyan: '#00d9ff',
    purple: '#6366f1',
    pink: '#ee00ff',
  },
};

// Common theme options
const commonThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '0.9375rem',
          fontWeight: 500,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        },
        elevation0: {
          border: '1px solid',
          borderColor: 'var(--mui-palette-divider)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 20,
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: brandColors.primary.main,
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderBottomColor: 'var(--mui-palette-divider)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: '1px solid',
          borderRightColor: 'var(--mui-palette-divider)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  },
};

// Light theme - based on your light design example
export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    background: {
      default: '#fafbff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4b5563',
    },
    divider: '#e5e7eb',
    error: {
      main: '#ef4444',
      light: '#fca5a5',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',
      light: '#93bbfd',
      dark: '#2563eb',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
      dark: '#059669',
    },
    action: {
      hover: alpha('#6366f1', 0.04),
      selected: alpha('#6366f1', 0.08),
      focus: alpha('#6366f1', 0.12),
    },
  },
  components: {
    ...commonThemeOptions.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fafbff',
          backgroundImage: `
            radial-gradient(circle at 200px 200px, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.02) 0%, transparent 50%)
          `,
          backgroundAttachment: 'fixed',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.03), transparent 25%),
              radial-gradient(circle at 85% 80%, rgba(236, 72, 153, 0.03), transparent 25%)
            `,
            pointerEvents: 'none',
            zIndex: 0,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...commonThemeOptions.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

// Dark theme - based on your dark design example
export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#818cf8',
      light: '#a5b4fc',
      dark: '#6366f1',
    },
    secondary: {
      main: '#f472b6',
      light: '#f9a8d4',
      dark: '#ec4899',
    },
    background: {
      default: '#0f0f23',
      paper: '#161625',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#9ca3af',
    },
    divider: alpha('#94a3b8', 0.12),
    error: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444',
    },
    warning: {
      main: '#fbbf24',
      light: '#fcd34d',
      dark: '#f59e0b',
    },
    info: {
      main: '#60a5fa',
      light: '#93bbfd',
      dark: '#3b82f6',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
    },
    action: {
      hover: alpha('#818cf8', 0.08),
      selected: alpha('#818cf8', 0.12),
      focus: alpha('#818cf8', 0.16),
    },
  },
  components: {
    ...commonThemeOptions.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0f0f23',
          backgroundImage: `
            linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%),
            radial-gradient(circle at 200px 200px, rgba(0, 217, 255, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(238, 0, 255, 0.03) 0%, transparent 40%)
          `,
          backgroundAttachment: 'fixed',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 15% 50%, rgba(0, 217, 255, 0.03), transparent 25%),
              radial-gradient(circle at 85% 80%, rgba(238, 0, 255, 0.03), transparent 25%)
            `,
            pointerEvents: 'none',
            zIndex: 0,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...commonThemeOptions.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
          boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6d28d9 0%, #db2777 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
          },
        },
        outlined: {
          borderColor: alpha('#818cf8', 0.5),
          '&:hover': {
            borderColor: '#818cf8',
            backgroundColor: alpha('#818cf8', 0.08),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#1a1a2e', 0.8),
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: alpha('#818cf8', 0.1),
        },
        elevation1: {
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.03)
          `,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#1e1e2e', 0.5),
            '& fieldset': {
              borderColor: alpha('#2a2a3e', 0.8),
            },
            '&:hover fieldset': {
              borderColor: alpha('#818cf8', 0.5),
            },
            '&.Mui-focused fieldset': {
              borderColor: '#818cf8',
              boxShadow: `0 0 0 2px ${alpha('#818cf8', 0.1)}`,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#2a2a3e', 0.6),
          '&.MuiChip-colorPrimary': {
            backgroundColor: alpha('#6366f1', 0.2),
            color: '#a5b4fc',
            border: `1px solid ${alpha('#6366f1', 0.3)}`,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: alpha('#ec4899', 0.2),
            color: '#f9a8d4',
            border: `1px solid ${alpha('#ec4899', 0.3)}`,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: alpha('#6366f1', 0.15),
            '&:hover': {
              backgroundColor: alpha('#6366f1', 0.2),
            },
          },
        },
      },
    },
  },
});

// Export themes
export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

export default themes;