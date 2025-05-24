import React from 'react';
import { Box, Typography, Breadcrumbs, Link, IconButton } from '@mui/material';
import { ArrowBack, NavigateNext } from '@mui/icons-material';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  onBack,
  actions,
  children,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast) {
              return (
                <Typography key={index} color="text.primary" variant="body2">
                  {crumb.label}
                </Typography>
              );
            }

            return (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                href={crumb.href}
                onClick={crumb.onClick}
                sx={{ cursor: 'pointer' }}
                variant="body2"
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {onBack && (
            <IconButton onClick={onBack} size="small" sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
          )}
          
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              {title}
            </Typography>
            
            {subtitle && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {actions && (
          <Box display="flex" gap={1} alignItems="center">
            {actions}
          </Box>
        )}
      </Box>

      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
};

export default PageHeader;