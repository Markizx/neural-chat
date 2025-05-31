import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import createEmotionCache from '@/lib/createEmotionCache';
import theme from '@/lib/theme';
import AuthGuard from '@/components/AuthGuard';
import AdminLayout from '@/components/AdminLayout';

const clientSideEmotionCache = createEmotionCache();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

// Страницы которые не требуют аутентификации
const publicPages = ['/auth/login', '/auth/register'];

// Получение заголовка страницы
const getPageTitle = (pathname: string): string => {
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard';
    case '/users':
      return 'Users Management';
    case '/analytics':
      return 'Analytics';
    case '/subscriptions':
      return 'Subscriptions';
    case '/plans':
      return 'Plans Management';
    case '/chats':
      return 'Chats Overview';
    case '/settings':
      return 'Settings';
    default:
      return 'Admin Panel';
  }
};

export default function App({
  Component,
  emotionCache = clientSideEmotionCache,
  pageProps: { session, ...pageProps },
}: MyAppProps) {
  const router = useRouter();
  const isPublicPage = publicPages.includes(router.pathname);
  const pageTitle = getPageTitle(router.pathname);

  return (
    <CacheProvider value={emotionCache}>
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {isPublicPage ? (
              <Component {...pageProps} />
            ) : (
              <AuthGuard>
                <AdminLayout title={pageTitle}>
                  <Component {...pageProps} />
                </AdminLayout>
              </AuthGuard>
            )}
            <Toaster position="top-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </CacheProvider>
  );
}