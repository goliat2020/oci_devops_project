import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Typography,
  Paper,
  Box,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

function KpiDashboard() {
  const [dataTasks, setDataTasks] = useState([]);
  const [dataHours, setDataHours] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [insights, setInsights] = useState([]);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    // fetch KPI dashboard data from backend
    axios.get('/kpi/dashboard')
      .then(res => {
        const payload = res.data;
        const tasks = payload.tasksCompletedByUserSprint || [];
        const hours = payload.realHoursByUserSprint || [];
        setDataTasks(tasks);
        setDataHours(hours);
        // derive sprints
        const sprintMap = new Map();
        tasks.concat(hours).forEach(p => { if (p && p.sprintId != null) sprintMap.set(p.sprintId, p.sprintNombre || `Sprint ${p.sprintId}`); });
        const sList = Array.from(sprintMap.entries()).map(([id,name]) => ({id,name}));
        setSprints(sList);
        if (sList.length>0) setSelectedSprint(sList[0].id);
        // derive user list (names are used elsewhere to filter)
        const userMap = new Map();
        tasks.concat(hours).forEach(p => { if (p && p.userId!=null) userMap.set(p.userId, p.userNombre); });
        setSelectedUser('');
      })
      .catch(err => {
        console.error('Failed getting KPI dashboard', err);
      });
  }, []);

  function pointsForSprint(points, sprintId) {
    return points.filter(p => (sprintId==null) || (p.sprintId === sprintId));
  }

  // Build chart data for selected sprint: array of { name:userNombre, tasks: value, hours: value }
  function buildChartData(sprintId, userFilter) {
    const tasks = pointsForSprint(dataTasks, sprintId);
    const hours = pointsForSprint(dataHours, sprintId);
    const map = new Map();
    tasks.forEach(p=> map.set(p.userNombre || `User ${p.userId}`, { name: p.userNombre || `User ${p.userId}`, tasks: p.value || 0, hours: 0 }));
    hours.forEach(p=> {
      const key = p.userNombre || `User ${p.userId}`;
      const cur = map.get(key) || { name: key, tasks: 0, hours: 0 };
      cur.hours = p.value || 0;
      map.set(key, cur);
    });
    const results = Array.from(map.values());
    if (userFilter && userFilter !== '') {
      return results.filter(r => r.name === userFilter);
    }
    return results;
  }

  // Extract unique users for filter dropdown (both dataTasks and dataHours)
  const usersMap = new Map();
  dataTasks.concat(dataHours).forEach(p => { if (p && p.userId!=null) usersMap.set(p.userNombre, p.userId); });
  const usersList = Array.from(usersMap.keys());

  const chartData = useMemo(() => buildChartData(selectedSprint, selectedUser), [dataTasks, dataHours, selectedSprint, selectedUser]);

  // Metrics
  const totalHours = chartData.reduce((s,x)=> s + (x.hours||0), 0);
  const totalTasks = chartData.reduce((s,x)=> s + (x.tasks||0), 0);
  const devCount = chartData.length || 1;
  const avgTasksPerDev = devCount ? (totalTasks / devCount) : 0;
  const avgHoursPerDev = devCount ? (totalHours / devCount) : 0;

  // Generate simple insights and actions
  useEffect(() => {
    const ins = [];
    const act = [];
    if (chartData.length === 0) {
      ins.push('No data disponible para el sprint seleccionado.');
    } else {
  // find top/bottom performers
  const sortedByTasks = [...chartData].sort((a,b)=> b.tasks - a.tasks);
      const topTasks = sortedByTasks[0];
      const lowTasks = sortedByTasks[sortedByTasks.length-1];
      if (topTasks && lowTasks && (topTasks.tasks - lowTasks.tasks) / Math.max(1, topTasks.tasks) > 0.6) {
        ins.push(`Variación alta en tareas completadas: ${topTasks.name} completó ${topTasks.tasks} mientras ${lowTasks.name} completó ${lowTasks.tasks}.`);
        act.push('Revisar asignación de tareas y balancear la carga entre desarrolladores. Considerar tareas cruzadas o pareja (pairing).');
      }
      if (avgHoursPerDev > 40) {
        ins.push(`Promedio de horas por desarrollador es alto (${avgHoursPerDev.toFixed(1)}h).`);
        act.push('Analizar tareas que consumen muchas horas y verificar estimaciones. Planificar reducción de scope o redistribución.');
      }
      // find outliers in hours vs tasks
      chartData.forEach(d => {
        if (d.tasks > 0 && (d.hours / d.tasks) > 20) {
          ins.push(`${d.name} tiene alto ratio horas/tarea (${(d.hours/d.tasks).toFixed(1)}h por task).`);
          act.push(`Investigar bloqueos o tareas mal estimadas para ${d.name}. Facilitar soporte técnico o clarification de requisitos.`);
        }
      });
      if (ins.length===0) {
        ins.push('Distribución equilibrada detectada. Buen trabajo equipo.');
        act.push('Mantener prácticas actuales y monitorizar en próximos sprints.');
      }
    }
    setInsights(ins);
    setActions(act);
  }, [selectedSprint, dataTasks, dataHours, avgHoursPerDev, chartData]);

  return (
    <Box sx={{mt:2}}>
      <Paper sx={{p:2, mb:2}}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6">KPI Dashboard</Typography>
            <Typography variant="body2" color="textSecondary">Comparativa por usuario / sprint</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2">Sprint</Typography>
            <Select value={selectedSprint ?? ''} onChange={e => setSelectedSprint(e.target.value)} size="small" sx={{mr:1}}>
              <MenuItem value="">Todos</MenuItem>
              {sprints.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2" sx={{ml:2}}>Usuario</Typography>
            <Select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} size="small">
              <MenuItem value="">Todos</MenuItem>
              {usersList.map(u => (<MenuItem key={u} value={u}>{u}</MenuItem>))}
            </Select>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{p:2, height:360}}>
            <Typography variant="subtitle1">Tareas completadas por usuario</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{p:2, height:360}}>
            <Typography variant="subtitle1">Horas reales por usuario</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{p:2}}>
            <Typography variant="subtitle2">Métricas</Typography>
            <Typography>#Horas Reales: <strong>{totalHours.toFixed(1)}</strong></Typography>
            <Typography>#Promedio Tasks/Developer: <strong>{avgTasksPerDev.toFixed(2)}</strong></Typography>
            <Typography>#Promedio Horas/Developer: <strong>{avgHoursPerDev.toFixed(2)}</strong></Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{p:2}}>
            <Typography variant="subtitle2">Hallazgos</Typography>
            {insights.length===0 ? <Typography>No hay hallazgos.</Typography> : (
              <ul>
                {insights.map((i,idx) => <li key={idx}><Typography variant="body2">{i}</Typography></li>)}
              </ul>
            )}

            <Typography variant="subtitle2" sx={{mt:1}}>Acciones de mejora</Typography>
            {actions.length===0 ? <Typography>No se proponen acciones.</Typography> : (
              <ul>
                {actions.map((a,idx) => <li key={idx}><Typography variant="body2">{a}</Typography></li>)}
              </ul>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default KpiDashboard;
