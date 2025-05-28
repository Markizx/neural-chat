import React from 'react';
import { NextPage } from 'next';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import AdminLayout from '../components/AdminLayout';

const ChatsPage: NextPage = () => {
  return (
    <AdminLayout title="Чаты">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Чаты
        </Typography>
        
        <Grid container spacing={3}>
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
                  Активные чаты
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
                  Сообщений сегодня
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
                  Средняя длина чата
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
            Управление чатами
          </Typography>
          <Typography color="textSecondary">
            Функционал управления чатами будет добавлен в следующих версиях.
          </Typography>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default ChatsPage; 