import React, { useEffect, useRef } from 'react';
import { Button } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface GoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ 
  onSuccess, 
  onError,
  disabled = false 
}) => {
  const { googleLogin } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const handleGoogleResponse = async (response: any) => {
    try {
      await googleLogin(response.credential);
      onSuccess?.();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      onError?.(error.message || 'Google Sign-In failed');
    }
  };

  const initializeGoogleSignIn = () => {
    if (!window.google || initialized.current) return;

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not configured');
      onError?.('Google Sign-In not configured');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          type: 'standard',
          text: 'continue_with',
          logo_alignment: 'left',
        });
      }

      initialized.current = true;
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      onError?.('Failed to initialize Google Sign-In');
    }
  };

  useEffect(() => {
    // Check if Google SDK is loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google SDK to load
      const checkGoogleLoaded = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleLoaded);
          initializeGoogleSignIn();
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogleLoaded);
        if (!window.google) {
          onError?.('Failed to load Google Sign-In SDK');
        }
      }, 10000);

      return () => clearInterval(checkGoogleLoaded);
    }
  }, []);

  // Fallback button if Google SDK fails to load
  const handleFallbackClick = () => {
    if (window.google) {
      try {
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Failed to show Google Sign-In popup:', error);
        onError?.('Failed to show Google Sign-In popup');
      }
    } else {
      onError?.('Google Sign-In SDK not loaded');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Google's rendered button */}
      <div 
        ref={googleButtonRef} 
        style={{ 
          width: '100%',
          display: initialized.current ? 'block' : 'none' 
        }} 
      />
      
      {/* Fallback Material-UI button */}
      {!initialized.current && (
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleFallbackClick}
          disabled={disabled}
          sx={{ py: 1.5 }}
        >
          Continue with Google
        </Button>
      )}
    </div>
  );
};

export default GoogleSignIn; 