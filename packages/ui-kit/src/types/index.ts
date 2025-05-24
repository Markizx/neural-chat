// UI Kit Types

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface WithLoadingProps {
  loading?: boolean;
  loadingText?: string;
}

export interface WithDisabledProps {
  disabled?: boolean;
}

export interface WithSizeProps {
  size?: 'small' | 'medium' | 'large';
}

export interface WithColorProps {
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default';
}

export interface WithVariantProps {
  variant?: string;
}

export type ComponentSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ComponentColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default';
export type ComponentVariant = 'filled' | 'outlined' | 'text' | 'contained';

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  background: {
    default: string;
    paper: string;
  };
  divider: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  shadows: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
  };
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}