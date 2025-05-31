import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search,
  Close,
  FilterList,
  AccessTime,
  SmartToy,
  Psychology,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';
import { apiService } from '../../services/api.service';
import { format } from 'date-fns';

interface SearchResult {
  chatId: string;
  chatTitle: string;
  chatType: 'claude' | 'grok' | 'general';
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  highlights: string[];
}

interface ChatSearchProps {
  onSelectChat: (chatId: string, messageId?: string) => void;
  onClose?: () => void;
}

const ChatSearch: React.FC<ChatSearchProps> = ({ onSelectChat, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    chatType: 'all',
    role: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  
  const theme = useTheme();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedSearchQuery,
        ...(filters.chatType !== 'all' && { chatType: filters.chatType }),
        ...(filters.role !== 'all' && { role: filters.role }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      });

      const response = await apiService.get(`/chats/search?${params}`);
      setSearchResults((response.data as any).results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, filters]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Highlight search terms in text
  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights || highlights.length === 0) return text;

    let highlightedText = text;
    highlights.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark style="background-color: #fef3c7; padding: 2px; border-radius: 2px;">$1</mark>'
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'claude':
        return <SmartToy sx={{ color: '#FF6B6B' }} />;
      case 'grok':
        return <Psychology sx={{ color: '#667EEA' }} />;
      default:
        return <ChatIcon />;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Search your chat history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                  >
                    <Close />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => setFilterDialogOpen(true)}
                  sx={{ ml: 1 }}
                >
                  <FilterList />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              background: theme.palette.mode === 'dark'
                ? alpha('#1a1a2e', 0.6)
                : alpha('#f5f5f5', 0.5),
            },
          }}
        />

        {/* Active Filters */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.chatType !== 'all' && (
            <Chip
              label={`Type: ${filters.chatType}`}
              onDelete={() => setFilters({ ...filters, chatType: 'all' })}
              size="small"
            />
          )}
          {filters.role !== 'all' && (
            <Chip
              label={`Role: ${filters.role}`}
              onDelete={() => setFilters({ ...filters, role: 'all' })}
              size="small"
            />
          )}
          {filters.startDate && (
            <Chip
              label={`From: ${format(filters.startDate, 'MMM d, yyyy')}`}
              onDelete={() => setFilters({ ...filters, startDate: null })}
              size="small"
            />
          )}
          {filters.endDate && (
            <Chip
              label={`To: ${format(filters.endDate, 'MMM d, yyyy')}`}
              onDelete={() => setFilters({ ...filters, endDate: null })}
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Search Results */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : searchResults.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">
              {searchQuery
                ? 'No results found. Try different keywords or filters.'
                : 'Start typing to search your chat history...'}
            </Typography>
          </Box>
        ) : (
          <List>
            <AnimatePresence>
              {searchResults.map((result, index) => (
                <motion.div
                  key={`${result.chatId}-${result.messageId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ListItem
                    button
                    onClick={() => onSelectChat(result.chatId, result.messageId)}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <ListItemIcon>
                      {getChatIcon(result.chatType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {result.chatTitle}
                          </Typography>
                          <Chip
                            label={result.role}
                            size="small"
                            color={result.role === 'user' ? 'primary' : 'secondary'}
                            sx={{ height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ mb: 0.5 }}
                          >
                            {highlightText(
                              result.content.length > 150
                                ? result.content.substring(0, 150) + '...'
                                : result.content,
                              result.highlights
                            )}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(result.createdAt), 'MMM d, yyyy HH:mm')}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider />}
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </Box>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Search Filters</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Chat Type</InputLabel>
              <Select
                value={filters.chatType}
                label="Chat Type"
                onChange={(e) => setFilters({ ...filters, chatType: e.target.value })}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="claude">Claude</MenuItem>
                <MenuItem value="grok">Grok</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Message Role</InputLabel>
              <Select
                value={filters.role}
                label="Message Role"
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="assistant">Assistant</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(newValue) => setFilters({ ...filters, startDate: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />

              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(newValue) => setFilters({ ...filters, endDate: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFilters({
                chatType: 'all',
                role: 'all',
                startDate: null,
                endDate: null,
              });
            }}
          >
            Clear All
          </Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatSearch; 