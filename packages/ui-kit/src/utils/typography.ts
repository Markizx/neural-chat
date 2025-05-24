// Typography utilities

export const fontFamily = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ].join(', '),
  serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'].join(', '),
  mono: [
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ].join(', '),
};

export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
  '7xl': ['4.5rem', { lineHeight: '1' }],
  '8xl': ['6rem', { lineHeight: '1' }],
  '9xl': ['8rem', { lineHeight: '1' }],
};

export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
  3: 0.75,
  4: 1,
  5: 1.25,
  6: 1.5,
  7: 1.75,
  8: 2,
  9: 2.25,
  10: 2.5,
};

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

export const textAlign = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
  start: 'start',
  end: 'end',
};

export const textDecoration = {
  underline: 'underline',
  overline: 'overline',
  'line-through': 'line-through',
  'no-underline': 'none',
};

export const textTransform = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  'normal-case': 'none',
};

export const createTypography = (baseFontSize: number = 16) => {
  const pxToRem = (px: number): string => {
    return `${px / baseFontSize}rem`;
  };

  return {
    h1: {
      fontSize: pxToRem(96),
      fontWeight: fontWeight.light,
      lineHeight: lineHeight.tight,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: pxToRem(60),
      fontWeight: fontWeight.light,
      lineHeight: lineHeight.tight,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: pxToRem(48),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.snug,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: pxToRem(34),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.snug,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: pxToRem(24),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.normal,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: pxToRem(20),
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.normal,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontSize: pxToRem(16),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.relaxed,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: pxToRem(14),
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.normal,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: pxToRem(16),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.normal,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: pxToRem(14),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.normal,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: pxToRem(14),
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.relaxed,
      letterSpacing: '0.02857em',
      textTransform: textTransform.uppercase,
    },
    caption: {
      fontSize: pxToRem(12),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.normal,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: pxToRem(12),
      fontWeight: fontWeight.normal,
      lineHeight: lineHeight.loose,
      letterSpacing: '0.08333em',
      textTransform: textTransform.uppercase,
    },
  };
};

export const typography = createTypography();

export default typography;