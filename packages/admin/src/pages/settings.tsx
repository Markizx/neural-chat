import React from 'react';
import { NextPage } from 'next';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import AdminLayout from '../components/AdminLayout';

const SettingsPage: NextPage = () => {
  return (
    <AdminLayout title="Настройки">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Настройки
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Общие настройки
                </Typography>
                <Typography color="textSecondary">
                  Настройки системы будут добавлены в следующих версиях.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API настройки
                </Typography>
                <Typography color="textSecondary">
                  Управление API ключами и настройками будет добавлено в следующих версиях.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Безопасность
                </Typography>
                <Typography color="textSecondary">
                  Настройки безопасности будут добавлены в следующих версиях.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Уведомления
                </Typography>
                <Typography color="textSecondary">
                  Настройки уведомлений будут добавлены в следующих версиях.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default SettingsPage; 