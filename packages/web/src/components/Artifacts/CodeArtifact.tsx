import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';

interface CodeArtifactProps {
  artifact: {
    content: string;
    language?: string;
  };
}

const CodeArtifact: React.FC<CodeArtifactProps> = ({ artifact }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [artifact.content]);

  const getLanguageClass = () => {
    const language = artifact.language?.toLowerCase() || 'plain';
    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      rb: 'ruby',
      yml: 'yaml',
      sh: 'bash',
    };
    return `language-${languageMap[language] || language}`;
  };

  return (
    <Box
      sx={{
        '& pre': {
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
          lineHeight: 1.5,
        },
        '& code': {
          fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
        },
      }}
    >
      <pre className={getLanguageClass()}>
        <code className={getLanguageClass()}>
          {artifact.content}
        </code>
      </pre>
    </Box>
  );
};

export default CodeArtifact;