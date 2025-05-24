import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Block,
  CheckCircle,
  Delete,
  Email,
  Key,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface UserActionsProps {
  user: any;
}

export default function UserActions({ user }: UserActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const suspendMutation = useMutation({
    mutationFn: () => adminApi.suspendUser(user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User suspended successfully');
      handleClose();
    },
    onError: () => {
      toast.error('Failed to suspend user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminApi.activateUser(user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User activated successfully');
      handleClose();
    },
    onError: () => {
      toast.error('Failed to activate user');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => adminApi.resetUserPassword(user._id),
    onSuccess: () => {
      toast.success('Password reset email sent');
      handleClose();
    },
    onError: () => {
      toast.error('Failed to reset password');
    },
  });

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => {/* Navigate to edit */}}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        
        {user.status === 'active' ? (
          <MenuItem onClick={() => suspendMutation.mutate()}>
            <ListItemIcon>
              <Block fontSize="small" />
            </ListItemIcon>
            <ListItemText>Suspend User</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => activateMutation.mutate()}>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Activate User</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => resetPasswordMutation.mutate()}>
          <ListItemIcon>
            <Key fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {/* Send email */}}>
          <ListItemIcon>
            <Email fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {/* Delete user */}} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}