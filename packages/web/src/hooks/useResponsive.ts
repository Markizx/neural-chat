import { useTheme, useMediaQuery } from '@mui/material';

export interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isLargeMobile: boolean;
  isSmallTablet: boolean;
  isLargeTablet: boolean;
  isSmallDesktop: boolean;
  isLargeDesktop: boolean;
}

export const useResponsive = (): ResponsiveBreakpoints => {
  const theme = useTheme();

  // Основные breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Детальные breakpoints для мобильных устройств
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const isLargeMobile = useMediaQuery('(min-width: 481px) and (max-width: 767px)');

  // Детальные breakpoints для планшетов
  const isSmallTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isLargeTablet = useMediaQuery('(min-width: 1024px) and (max-width: 1199px)');

  // Детальные breakpoints для десктопов
  const isSmallDesktop = useMediaQuery('(min-width: 1200px) and (max-width: 1439px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1440px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
    isSmallDesktop,
    isLargeDesktop,
  };
};

// Утилитарные функции для адаптивных значений
export const getResponsiveValue = <T>(
  values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    smallMobile?: T;
    largeMobile?: T;
    smallTablet?: T;
    largeTablet?: T;
    smallDesktop?: T;
    largeDesktop?: T;
  },
  breakpoints: ResponsiveBreakpoints
): T | undefined => {
  if (breakpoints.isSmallMobile && values.smallMobile !== undefined) {
    return values.smallMobile;
  }
  if (breakpoints.isLargeMobile && values.largeMobile !== undefined) {
    return values.largeMobile;
  }
  if (breakpoints.isMobile && values.mobile !== undefined) {
    return values.mobile;
  }
  if (breakpoints.isSmallTablet && values.smallTablet !== undefined) {
    return values.smallTablet;
  }
  if (breakpoints.isLargeTablet && values.largeTablet !== undefined) {
    return values.largeTablet;
  }
  if (breakpoints.isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  if (breakpoints.isSmallDesktop && values.smallDesktop !== undefined) {
    return values.smallDesktop;
  }
  if (breakpoints.isLargeDesktop && values.largeDesktop !== undefined) {
    return values.largeDesktop;
  }
  if (breakpoints.isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  
  return undefined;
};

// Хук для адаптивных стилей
export const useResponsiveStyles = () => {
  const breakpoints = useResponsive();
  
  return {
    ...breakpoints,
    getResponsiveValue: <T>(values: {
      mobile?: T;
      tablet?: T;
      desktop?: T;
      smallMobile?: T;
      largeMobile?: T;
      smallTablet?: T;
      largeTablet?: T;
      smallDesktop?: T;
      largeDesktop?: T;
    }) => getResponsiveValue<T>(values, breakpoints),
  };
}; 