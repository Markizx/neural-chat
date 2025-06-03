import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Check as CheckIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

interface Plan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  status: 'active' | 'inactive';
  isPopular?: boolean;
}

const PlansPage: NextPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [newFeature, setNewFeature] = useState('');
  
  const [formData, setFormData] = useState<Partial<Plan>>({
    name: '',
    description: '',
    price: 0,
    interval: 'month',
    features: [],
    status: 'active',
    isPopular: false
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/v1/admin/plans`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.data.plans);
      } else {
        throw new Error('Failed to fetch plans');
      }
    } catch (error) {
      setError('Ошибка загрузки планов');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    try {
      const method = selectedPlan ? 'PUT' : 'POST';
      const url = selectedPlan 
        ? `/api/v1/admin/plans/${selectedPlan._id}` 
        : '/api/v1/admin/plans';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchPlans();
        handleCloseDialog();
      } else {
        throw new Error('Failed to save plan');
      }
    } catch (error) {
      setError('Ошибка сохранения плана');
      console.error('Error saving plan:', error);
    }
  };

  const deletePlan = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/v1/admin/plans/${selectedPlan._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchPlans();
        setDeleteDialogOpen(false);
        setSelectedPlan(null);
      } else {
        throw new Error('Failed to delete plan');
      }
    } catch (error) {
      setError('Ошибка удаления плана');
      console.error('Error deleting plan:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleNewPlan = () => {
    setSelectedPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      interval: 'month',
      features: [],
      status: 'active',
      isPopular: false
    });
    setEditDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData(plan);
    setEditDialogOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedPlan(null);
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  const formatPrice = (price: number, interval: string) => {
    return `$${price}/${interval === 'month' ? 'мес' : 'год'}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Управление планами подписки
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewPlan}
        >
          Создать план
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={6} lg={4} key={plan._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.isPopular ? '2px solid' : '1px solid',
                  borderColor: plan.isPopular ? 'primary.main' : 'divider'
                }}
              >
                {plan.isPopular && (
                  <Chip
                    icon={<StarIcon />}
                    label="Популярный"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: 16,
                      zIndex: 1
                    }}
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1, pt: plan.isPopular ? 3 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MoneyIcon color="primary" />
                    <Typography variant="h5" component="h2">
                      {plan.name}
                    </Typography>
                    <Chip 
                      label={plan.status === 'active' ? 'Активный' : 'Неактивный'}
                      color={plan.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {plan.description || 'Описание отсутствует'}
                  </Typography>

                  <Typography variant="h4" component="div" color="primary" sx={{ my: 2 }}>
                    {formatPrice(plan.price, plan.interval)}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Особенности:
                  </Typography>
                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <CheckIcon color="success" sx={{ mr: 1, fontSize: 18 }} />
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ p: 2 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditPlan(plan)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeletePlan(plan)}
                  >
                    Удалить
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Диалог создания/редактирования плана */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPlan ? 'Редактировать план' : 'Создать новый план'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Название плана"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Цена"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Описание"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Период</InputLabel>
                <Select
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value as 'month' | 'year' })}
                  label="Период"
                >
                  <MenuItem value="month">Месяц</MenuItem>
                  <MenuItem value="year">Год</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  label="Статус"
                >
                  <MenuItem value="active">Активный</MenuItem>
                  <MenuItem value="inactive">Неактивный</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  />
                }
                label="Популярный план"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Особенности плана
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.features?.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    onDelete={() => removeFeature(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Добавить особенность"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addFeature();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={addFeature}
                  disabled={!newFeature.trim()}
                >
                  Добавить
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Отмена
          </Button>
          <Button onClick={savePlan} variant="contained">
            {selectedPlan ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить план &quot;{selectedPlan?.name}&quot;?
            Это действие необратимо.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button color="error" onClick={deletePlan}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlansPage; 