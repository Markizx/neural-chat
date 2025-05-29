import { useState } from 'react';
import { 
  Paper, 
  Box, 
  TextField, 
  InputAdornment,
  Button,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Search, FileDownload } from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import UserActions from '@/components/UserActions';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', width: 150 },
  { field: 'email', headerName: 'Email', width: 200 },
  {
    field: 'subscription',
    headerName: 'Plan',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value.plan}
        color={params.value.plan === 'business' ? 'primary' : params.value.plan === 'pro' ? 'secondary' : 'default'}
        size="small"
      />
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value}
        color={params.value === 'active' ? 'success' : 'error'}
        size="small"
      />
    ),
  },
  {
    field: 'createdAt',
    headerName: 'Joined',
    width: 150,
    valueFormatter: (params) => format(new Date(params.value), 'MMM d, yyyy'),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    renderCell: (params: GridRenderCellParams) => (
      <UserActions user={params.row} />
    ),
  },
];

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { page, pageSize, search: searchQuery }],
    queryFn: () => adminApi.getUsers({ page, limit: pageSize, search: searchQuery }),
  });

  // Обрабатываем данные правильно
  const users = data?.data?.users || [];
  const total = data?.data?.total || 0;

  // Преобразуем данные для DataGrid
  const rows = users.map((user: any) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    subscription: user.subscription || { plan: 'free' },
    status: user.status || 'active',
    createdAt: user.createdAt,
    ...user
  }));

  const handleExport = async () => {
    const csv = await adminApi.exportUsers();
    const blob = new Blob([csv.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <AdminLayout title="Users">
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <TextField
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          rowCount={total}
          pageSizeOptions={[25, 50, 100]}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          paginationMode="server"
          checkboxSelection
          disableRowSelectionOnClick
          autoHeight
        />
      </Paper>
    </AdminLayout>
  );
}