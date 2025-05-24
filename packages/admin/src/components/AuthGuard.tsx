import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { LoadingSpinner } from '@smartchat/ui-kit';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [router, status]);

  if (status === 'loading') {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return null;
}