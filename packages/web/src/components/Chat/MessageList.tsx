import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Collapse,
  Rating,
  TextField,
  Button,
} from '@mui/material';
import {
  Person,
  SmartToy,
  MoreVert,
  Edit,
  Delete,
  Refresh,
  ContentCopy,
  ThumbUp,
  ThumbDown,
  Code,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types';
import ArtifactViewer from '../Artifacts/ArtifactViewer';

interface MessageListProps {
  messages: Message[];
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

interface MessageItemProps {
  message: Message;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(message.feedback?.rating || 0);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message._id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete && window.confirm('Delete this message?')) {
      onDelete(message._id);
    }
  };

  const handleRegenerate = () => {
    handleMenuClose();
    if (onRegenerate) {
      onRegenerate(message._id);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };

  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          width: 36,
          height: 36,
        }}
      >
        {isUser ? <Person /> : <SmartToy />}
      </Avatar>

      <Box sx={{ flex: 1, maxWidth: '80%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 0.5,
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {isUser ? 'You' : message.model || 'Assistant'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(message.createdAt), 'HH:mm')}
          </Typography>
          {message.isEdited && (
            <Typography variant="caption" color="text.secondary">
              (edited)
            </Typography>
          )}
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.50' : 'background.paper',
            border: 1,
            borderColor: 'divider',
          }}
        >
          {isEditing ? (
            <Box>
              <TextField
                fullWidth
                multiline
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="small" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <ReactMarkdown className="markdown-body">
                {message.content}
              </ReactMarkdown>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {message.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      label={attachment.name}
                      size="small"
                      icon={<Code />}
                    />
                  ))}
                </Box>
              )}

              {/* Artifacts */}
              {message.artifacts && message.artifacts.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {message.artifacts.map((artifact, index) => (
                    <ArtifactViewer key={index} artifact={artifact} />
                  ))}
                </Box>
              )}

              {/* Usage info */}
              {message.usage && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tokens: {message.usage.totalTokens}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cost: ${message.usage.cost.toFixed(4)}
                  </Typography>
                </Box>
              )}

              {/* Feedback for assistant messages */}
              {!isUser && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    onClick={() => setShowFeedback(!showFeedback)}
                  >
                    Rate this response
                  </Button>
                  <Collapse in={showFeedback}>
                    <Box sx={{ mt: 1 }}>
                      <Rating
                        value={rating}
                        onChange={(_, value) => setRating(value || 0)}
                      />
                    </Box>
                  </Collapse>
                </Box>
              )}
            </>
          )}
        </Paper>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleCopy}>
            <ContentCopy fontSize="small" sx={{ mr: 1 }} />
            Copy
          </MenuItem>
          {isUser && onEdit && (
            <MenuItem onClick={handleEdit}>
              <Edit fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
          )}
          {!isUser && onRegenerate && (
            <MenuItem onClick={handleRegenerate}>
              <Refresh fontSize="small" sx={{ mr: 1 }} />
              Regenerate
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Delete fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
        </Menu>
      </Box>
    </Box>
  );
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  return (
    <Box>
      {messages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          onEdit={onEdit}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
        />
      ))}
    </Box>
  );
};

export default MessageList;