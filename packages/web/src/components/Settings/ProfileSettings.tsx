import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  Grid,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';

interface ProfileForm {
  name: string;
  email: string;
}

const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiService.put('/user/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser((data as any).user);
    },
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiService.upload('/user/avatar', formData);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser((data as any).user);
      setAvatarFile(null);
      setAvatarPreview(null);
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = () => {
    if (avatarFile) {
      updateAvatarMutation.mutate(avatarFile);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage your personal information and account settings
      </Typography>

      {/* Avatar */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Profile Picture
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            src={avatarPreview || user?.avatar}
            sx={{ width: 100, height: 100 }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <input
              accept="image/*"
              id="avatar-upload"
              type="file"
              hidden
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatar-upload">
              <IconButton
                color="primary"
                component="span"
                disabled={updateAvatarMutation.isPending}
              >
                <PhotoCamera />
              </IconButton>
            </label>
            {avatarFile && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={handleAvatarUpload}
                  disabled={updateAvatarMutation.isPending}
                >
                  {updateAvatarMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    'Upload'
                  )}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              disabled
              {...register('email')}
              helperText="Email cannot be changed"
            />
          </Grid>
        </Grid>

        {updateProfileMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to update profile
          </Alert>
        )}

        {updateProfileMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Profile updated successfully
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </form>

      {/* Account info */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Account Created
            </Typography>
            <Typography>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Last Login
            </Typography>
            <Typography>
              {user?.metadata?.lastLogin
                ? new Date(user.metadata.lastLogin).toLocaleDateString()
                : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              User ID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {user?._id || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Referral Code
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {user?.metadata?.referralCode || '-'}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ProfileSettings;