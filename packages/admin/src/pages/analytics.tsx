import React from 'react';
import { NextPage } from 'next';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import AdminLayout from '../components/AdminLayout';

const AnalyticsPage: NextPage = () => {
  return (
    <AdminLayout title="Аналитика">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Аналитика
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Всего пользователей
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
                  Активные пользователи
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
                  Всего чатов
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
                  Всего сообщений
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
            Детальная аналитика
          </Typography>
          <Typography color="textSecondary">
            Детальная аналитика будет добавлена в следующих версиях.
          </Typography>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default AnalyticsPage; 