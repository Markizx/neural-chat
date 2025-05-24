import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';

interface ReactArtifactProps {
  artifact: {
    content: string;
    title?: string;
  };
}

const ReactArtifact: React.FC<ReactArtifactProps> = ({ artifact }) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Create a safe environment for React components
      const createSafeComponent = () => {
        // Wrap the component code in an IIFE
        const wrappedCode = `
          (() => {
            const React = window.React;
            const { useState, useEffect, useRef, useMemo, useCallback } = React;
            
            ${artifact.content}
            
            return typeof Component !== 'undefined' ? Component : (() => React.createElement('div', null, 'No component exported'));
          })()
        `;

        // Create a sandboxed iframe for rendering
        if (iframeRef.current) {
          const iframe = iframeRef.current;
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (iframeDoc) {
            // Inject React and styles into iframe
            iframeDoc.open();
            iframeDoc.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
                  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
                  <style>
                    body {
                      margin: 0;
                      padding: 16px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    * {
                      box-sizing: border-box;
                    }
                  </style>
                </head>
                <body>
                  <div id="root"></div>
                  <script>
                    try {
                      ${wrappedCode}
                      const Component = eval('(' + \`${wrappedCode}\` + ')');
                      const root = ReactDOM.createRoot(document.getElementById('root'));
                      root.render(React.createElement(Component));
                    } catch (error) {
                      document.getElementById('root').innerHTML = 
                        '<div style="color: red; padding: 16px; border: 1px solid red; border-radius: 4px;">' +
                        '<strong>Error:</strong> ' + error.message +
                        '</div>';
                    }
                  </script>
                </body>
              </html>
            `);
            iframeDoc.close();
          }
        }

        setLoading(false);
      };

      // Small delay to ensure iframe is ready
      setTimeout(createSafeComponent, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to render React component');
      setLoading(false);
    }
  }, [artifact.content]);

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', minHeight: 200 }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          minHeight: '400px',
          border: 'none',
          display: loading ? 'none' : 'block',
        }}
        title={artifact.title || 'React Component'}
        sandbox="allow-scripts"
      />
    </Box>
  );
};

export default ReactArtifact;