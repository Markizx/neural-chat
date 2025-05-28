import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ContentCopy,
  Delete,
  Add,
} from '@mui/icons-material';
import { format } from 'date-fns';

const ApiSettings: React.FC = () => {
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState('');

  // Mock API keys data
  const apiKeys = [
    {
      id: '1',
      name: 'Production Key',
      key: 'sk_live_1234567890abcdef',
      created: new Date('2024-01-15'),
      lastUsed: new Date('2024-02-20'),
      status: 'active',
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_abcdef1234567890',
      created: new Date('2024-02-01'),
      lastUsed: null,
      status: 'active',
    },
  ];

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const handleCreateKey = () => {
    // TODO: Implement API key creation
    console.log('Create key:', keyName);
    setCreateDialogOpen(false);
    setKeyName('');
  };

  const handleDeleteKey = (id: string) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      // TODO: Implement API key deletion
      console.log('Delete key:', id);
    }
  };

  const maskKey = (key: string) => {
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        API Keys
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
                      Manage your API keys for programmatic access to NeuralChat
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        API access is available for Business plan subscribers. Keep your API keys secure and never share them publicly.
      </Alert>

      {/* Create button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create New Key
        </Button>
      </Box>

      {/* API Keys table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>{apiKey.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      value={showKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setShowKey({
                                  ...showKey,
                                  [apiKey.id]: !showKey[apiKey.id],
                                })
                              }
                            >
                              {showKey[apiKey.id] ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleCopyKey(apiKey.key)}
                            >
                              <ContentCopy />
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { fontFamily: 'monospace' },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>{format(apiKey.created, 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  {apiKey.lastUsed ? format(apiKey.lastUsed, 'MMM d, yyyy') : 'Never'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={apiKey.status}
                    color={apiKey.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteKey(apiKey.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* API Documentation */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Start
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`# Install the SDK
npm install @neuralchat/sdk

# Initialize the client
import { NeuralChat } from '@neuralchat/sdk';

const client = new NeuralChat({
  apiKey: 'your-api-key'
});

# Send a message
const response = await client.chat.send({
  model: 'claude-4-opus',
  message: 'Hello, world!'
});`}
          </Typography>
        </Paper>
        
        <Box sx={{ mt: 2 }}>
                      <Button variant="outlined" href="https://docs.neuralchat.pro" target="_blank">
            View Full Documentation
          </Button>
        </Box>
      </Box>

      {/* Create API Key Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Key Name"
            placeholder="e.g., Production Key"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            margin="normal"
            helperText="Give your API key a descriptive name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateKey}
            variant="contained"
            disabled={!keyName.trim()}
          >
            Create Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiSettings;