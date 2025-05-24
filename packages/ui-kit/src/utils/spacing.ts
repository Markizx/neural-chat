// Spacing utilities

export const spacing = {
  // Base unit: 4px
  unit: 4,
  
  // Spacing scale
  0: 0,
  px: '1px',
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

export const getSpacing = (...values: (keyof typeof spacing)[]): string => {
  return values
    .map((value) => {
      const space = spacing[value];
      return typeof space === 'number' ? `${space}px` : space;
    })
    .join(' ');
};

export const margin = {
  auto: 'auto',
  ...Object.entries(spacing).reduce((acc, [key, value]) => {
    const px = typeof value === 'number' ? `${value}px` : value;
    return {
      ...acc,
      [`m${key}`]: { margin: px },
      [`mx${key}`]: { marginLeft: px, marginRight: px },
      [`my${key}`]: { marginTop: px, marginBottom: px },
      [`mt${key}`]: { marginTop: px },
      [`mr${key}`]: { marginRight: px },
      [`mb${key}`]: { marginBottom: px },
      [`ml${key}`]: { marginLeft: px },
    };
  }, {}),
};

export const padding = {
  ...Object.entries(spacing).reduce((acc, [key, value]) => {
    const px = typeof value === 'number' ? `${value}px` : value;
    return {
      ...acc,
      [`p${key}`]: { padding: px },
      [`px${key}`]: { paddingLeft: px, paddingRight: px },
      [`py${key}`]: { paddingTop: px, paddingBottom: px },
      [`pt${key}`]: { paddingTop: px },
      [`pr${key}`]: { paddingRight: px },
      [`pb${key}`]: { paddingBottom: px },
      [`pl${key}`]: { paddingLeft: px },
    };
  }, {}),
};

export const gap = {
  ...Object.entries(spacing).reduce((acc, [key, value]) => {
    const px = typeof value === 'number' ? `${value}px` : value;
    return {
      ...acc,
      [`gap${key}`]: { gap: px },
      [`gapX${key}`]: { columnGap: px },
      [`gapY${key}`]: { rowGap: px },
    };
  }, {}),
};

export const createSpacing = (factor: number = 8) => {
  return (multiplier: number = 1): number => {
    return factor * multiplier;
  };
};

export default spacing;