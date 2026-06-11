import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, CircularProgress, Alert,
  Stack, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#3B82F6', '#14B8A6'];

export default function KpiDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedSprint, setSelectedSprint] = useState('ALL');

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const res = await fetch('/kpi/dashboard');
        if (!res.ok) throw new Error('Network response was not ok');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchKpis();
    const intervalId = setInterval(fetchKpis, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const buildChartData = (sourceArray, keyField, valField, nameField = null) => {
    if (!sourceArray) return [];
    return sourceArray.map(item => ({
      name: nameField ? item[nameField] : item[keyField],
      value: item[valField]
    }));
  };

  const tasksByState = useMemo(() => buildChartData(data?.tasksByState, 'name', 'totalTareas'), [data]);
  const tasksByPriority = useMemo(() => buildChartData(data?.tasksByPriority, 'name', 'totalTareas'), [data]);

  const uniqueUsers = useMemo(() => {
    if (!data) return [];
    const usersMap = new Map();
    (data.tasksCompletedByUserSprint || []).forEach(t => usersMap.set(t.userId, t.userNombre));
    (data.realHoursByUserSprint || []).forEach(h => usersMap.set(h.userId, h.userNombre));
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name: name || `User ${id}` }));
  }, [data]);

  const uniqueSprints = useMemo(() => {
    if (!data) return [];
    const sprintsMap = new Map();
    (data.tasksCompletedByUserSprint || []).forEach(t => sprintsMap.set(t.sprintId, t.sprintNombre));
    (data.realHoursByUserSprint || []).forEach(h => sprintsMap.set(h.sprintId, h.sprintNombre));
    return Array.from(sprintsMap.entries()).map(([id, name]) => ({ id, name: name || `Sprint ${id}` }));
  }, [data]);

  // Filtered Data for Dev/Sprint Charts
  const filteredTasksByUser = useMemo(() => {
    if (!data?.tasksCompletedByUserSprint) return [];
    const filtered = data.tasksCompletedByUserSprint.filter(t => 
      (selectedUser === 'ALL' || t.userId === selectedUser) &&
      (selectedSprint === 'ALL' || t.sprintId === selectedSprint)
    );
    // Group by User + Sprint composite name to avoid collisions in chart
    return filtered.map(t => ({
      name: `${t.userNombre || 'User'} (${t.sprintNombre || 'Sprint'})`,
      value: t.value || t.totalTareas || 0
    }));
  }, [data, selectedUser, selectedSprint]);

  const filteredHoursByUser = useMemo(() => {
    if (!data?.realHoursByUserSprint) return [];
    const filtered = data.realHoursByUserSprint.filter(h => 
      (selectedUser === 'ALL' || h.userId === selectedUser) &&
      (selectedSprint === 'ALL' || h.sprintId === selectedSprint)
    );
    return filtered.map(h => ({
      name: `${h.userNombre || 'User'} (${h.sprintNombre || 'Sprint'})`,
      value: h.value || h.horasReales || 0
    }));
  }, [data, selectedUser, selectedSprint]);


  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 4, borderRadius: 2 }}>Error loading KPIs: {error}</Alert>;
  }

  if (!data) return null;

  const totalTasks = data.tasksByState?.reduce((acc, curr) => acc + curr.totalTareas, 0) || 0;
  const completedTasks = data.tasksByState?.find(s => 
    s.name === 'Done' || s.name === 'Completada' || s.name === 'Completado'
  )?.totalTareas || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHours = data.realHoursByUserSprint?.reduce((acc, curr) => acc + (curr.value || curr.horasReales || 0), 0) || 0;

  const StatCard = ({ title, value, subtitle, icon, valueColor = 'text.primary' }) => (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        borderRadius: 3, 
        background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.4) 0%, rgba(17, 24, 39, 0.2) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="500" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="800" color={valueColor} sx={{ my: 1, letterSpacing: '-0.5px' }}>
              {value}
            </Typography>
            {subtitle && (
               <Typography variant="caption" color="text.disabled">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', display: 'flex' }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" fontWeight="800" gutterBottom sx={{ letterSpacing: '-0.5px', mb: 4 }}>
        Dashboard Analytics
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Tareas" value={totalTasks} icon={<AssignmentTurnedInIcon sx={{ color: 'primary.main', fontSize: 28 }} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Ratio Completado" value={`${completionRate}%`} valueColor={completionRate >= 50 ? 'success.main' : 'error.main'} icon={<SpeedIcon sx={{ color: 'success.main', fontSize: 28 }} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Horas Invertidas" value={totalHours.toFixed(1)} subtitle="Global del equipo" icon={<AccessTimeIcon sx={{ color: 'warning.main', fontSize: 28 }} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Eficiencia Global" value={(data?.estimationVsReal?.reduce((acc, curr) => acc + (curr.ratioEficiencia || 100), 0) / (data?.estimationVsReal?.length || 1)).toFixed(1) + '%'} subtitle="Estimadas vs Reales" icon={<TrendingUpIcon sx={{ color: 'info.main', fontSize: 28 }} />} />
        </Grid>
      </Grid>

      {/* Global Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" mb={3} fontSize="1rem">Distribución por Estado</Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tasksByState} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {tasksByState.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#F9FAFB' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }}/>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" mb={3} fontSize="1rem">Tareas por Prioridad</Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriority} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtered Charts (Dev & Sprint) */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'background.paper', mb: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={4} spacing={2}>
          <Typography variant="h6" fontWeight="600" fontSize="1.1rem">Rendimiento por Desarrollador y Sprint</Typography>
          <Stack direction="row" spacing={2} minWidth={{ xs: '100%', md: '400px' }}>
            <FormControl fullWidth variant="filled" size="small" sx={{ '& .MuiFilledInput-root': { borderRadius: 2, '&::before, &::after': { display: 'none' } } }}>
              <InputLabel>Usuario</InputLabel>
              <Select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} disableUnderline>
                <MenuItem value="ALL">Todos los Usuarios</MenuItem>
                {uniqueUsers.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth variant="filled" size="small" sx={{ '& .MuiFilledInput-root': { borderRadius: 2, '&::before, &::after': { display: 'none' } } }}>
              <InputLabel>Sprint</InputLabel>
              <Select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)} disableUnderline>
                <MenuItem value="ALL">Todos los Sprints</MenuItem>
                {uniqueSprints.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>Tareas Terminadas (Desarrollador / Sprint)</Typography>
            <Box sx={{ height: 300 }}>
              {filteredTasksByUser.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredTasksByUser} margin={{ top: 10, right: 30, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="Tareas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.disabled">No hay datos para los filtros aplicados</Typography>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>Horas Reales (Desarrollador / Sprint)</Typography>
            <Box sx={{ height: 300 }}>
              {filteredHoursByUser.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredHoursByUser} margin={{ top: 10, right: 30, left: -20, bottom: 25 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                    <Area type="monotone" name="Horas" dataKey="value" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.disabled">No hay datos para los filtros aplicados</Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

    </Box>
  );
}
