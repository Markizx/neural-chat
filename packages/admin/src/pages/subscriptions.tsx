import React from 'react';
import { NextPage } from 'next';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import AdminLayout from '../components/AdminLayout';

const SubscriptionsPage: NextPage = () => {
  return (
    <AdminLayout title="Подписки">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Подписки
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Всего подписок
                </Typography>
                <Typography variant="h5" component="div">
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Активные подписки
                </Typography>
                <Typography variant="h5" component="div">
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Доход за месяц
                </Typography>
                <Typography variant="h5" component="div">
                  $0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Отмененные подписки
                </Typography>
                <Typography variant="h5" component="div">
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Управление подписками
          </Typography>
          <Typography color="textSecondary">
            Функционал управления подписками будет добавлен в следующих версиях.
          </Typography>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default SubscriptionsPage; 