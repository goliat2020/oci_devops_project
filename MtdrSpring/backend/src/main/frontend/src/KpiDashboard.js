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

const COLOR_PALETTE = [
  '#2563EB',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#84CC16',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#22C55E'
];

const getColor = (index) => COLOR_PALETTE[index % COLOR_PALETTE.length];

const normalizeLabel = (fallbackPrefix, value, label) => {
  if (label) {
    return label;
  }
  if (value == null) {
    return fallbackPrefix;
  }
  return `${fallbackPrefix} ${value}`;
};

const getPointsScope = (points, selectedSprint, selectedUser) => points.filter((point) => {
  const sprintMatches = selectedSprint === '' || String(point.sprintId) === String(selectedSprint);
  const userMatches = selectedUser === '' || String(point.userId) === String(selectedUser);
  return sprintMatches && userMatches;
});

const buildCatalogs = (points) => {
  const sprintMap = new Map();
  const userMap = new Map();

  points.forEach((point) => {
    if (!point) {
      return;
    }
    if (point.sprintId != null) {
      sprintMap.set(String(point.sprintId), {
        id: point.sprintId,
        name: normalizeLabel('Sprint', point.sprintId, point.sprintNombre),
        key: `sprint-${point.sprintId}`
      });
    }
    if (point.userId != null) {
      userMap.set(String(point.userId), {
        id: point.userId,
        name: normalizeLabel('Developer', point.userId, point.userNombre),
        key: `user-${point.userId}`
      });
    }
  });

  return {
    sprints: Array.from(sprintMap.values()).sort((a, b) => Number(a.id) - Number(b.id)),
    users: Array.from(userMap.values()).sort((a, b) => Number(a.id) - Number(b.id))
  };
};

const buildSummaryData = (tasksPoints, hoursPoints, selectedSprint, selectedUser) => {
  const filteredTasks = getPointsScope(tasksPoints, selectedSprint, selectedUser);
  const filteredHours = getPointsScope(hoursPoints, selectedSprint, selectedUser);
  const summaryMap = new Map();

  filteredTasks.forEach((point) => {
    const key = String(point.userId);
    summaryMap.set(key, {
      key,
      name: normalizeLabel('Developer', point.userId, point.userNombre),
      tasks: Number(point.value || 0),
      hours: 0
    });
  });

  filteredHours.forEach((point) => {
    const key = String(point.userId);
    const current = summaryMap.get(key) || {
      key,
      name: normalizeLabel('Developer', point.userId, point.userNombre),
      tasks: 0,
      hours: 0
    };
    current.hours += Number(point.value || 0);
    summaryMap.set(key, current);
  });

  return Array.from(summaryMap.values());
};

const buildStackedChartData = (points, selectedSprint, selectedUser, allPointsForCatalogs) => {
  const { sprints, users } = buildCatalogs(allPointsForCatalogs || points);
  const scopedPoints = getPointsScope(points, selectedSprint, selectedUser);
  const sprintsForChart = selectedSprint === ''
    ? sprints
    : sprints.filter((sprint) => String(sprint.id) === String(selectedSprint));
  const usersForChart = selectedUser === ''
    ? users
    : users.filter((user) => String(user.id) === String(selectedUser));

  const rows = sprintsForChart.map((sprint) => {
    const row = {
      sprintId: sprint.id,
      sprintNombre: sprint.name
    };
    usersForChart.forEach((user) => {
      row[user.key] = 0;
    });
    return row;
  });

  const rowMap = new Map(rows.map((row) => [String(row.sprintId), row]));

  scopedPoints.forEach((point) => {
    const row = rowMap.get(String(point.sprintId));
    const user = usersForChart.find((item) => String(item.id) === String(point.userId));
    if (row && user) {
      row[user.key] = (row[user.key] || 0) + Number(point.value || 0);
    }
  });

  return {
    chartData: rows,
    usersForChart
  };
};

const renderSeries = (usersForChart) => usersForChart.map((user, index) => (
  <Bar
    key={user.key}
    dataKey={user.key}
    name={user.name}
    fill={getColor(index)}
    isAnimationActive={false}
  />
));

const renderSeriesWithLabels = (usersForChart) => usersForChart.map((user, index) => {
  const CustomLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === null || value === undefined) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#000"
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {Math.round(value)}
      </text>
    );
  };

  return (
    <Bar
      key={`bar-${index}`}
      dataKey={user.key}
      name={user.name}
      fill={getColor(index)}
      isAnimationActive={false}
      label={<CustomLabel />}
    />
  );
});

function KpiDashboard() {
  const [dataTasks, setDataTasks] = useState([]);
  const [dataHours, setDataHours] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState('');
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
        setSelectedUser('');
      })
      .catch(err => {
        console.error('Failed getting KPI dashboard', err);
      });
  }, []);

  const allPoints = useMemo(() => dataTasks.concat(dataHours), [dataTasks, dataHours]);
  const { sprints: sprintOptions, users: userOptions } = useMemo(() => buildCatalogs(allPoints), [allPoints]);
  const tasksSummary = useMemo(() => buildSummaryData(dataTasks, dataHours, selectedSprint, selectedUser), [dataTasks, dataHours, selectedSprint, selectedUser]);
  const tasksChart = useMemo(() => buildStackedChartData(dataTasks, selectedSprint, selectedUser, allPoints), [dataTasks, selectedSprint, selectedUser, allPoints]);
  const hoursChart = useMemo(() => buildStackedChartData(dataHours, selectedSprint, selectedUser, allPoints), [dataHours, selectedSprint, selectedUser, allPoints]);

  // Metrics
  const totalHours = tasksSummary.reduce((s,x)=> s + (x.hours||0), 0);
  const totalTasks = tasksSummary.reduce((s,x)=> s + (x.tasks||0), 0);
  const devCount = tasksSummary.length || 1;
  const avgTasksPerDev = devCount ? (totalTasks / devCount) : 0;
  const avgHoursPerDev = devCount ? (totalHours / devCount) : 0;

  // Generate simple insights and actions
  useEffect(() => {
    const ins = [];
    const act = [];
    if (tasksSummary.length === 0) {
      ins.push('No data disponible para el sprint seleccionado.');
    } else {
  // find top/bottom performers
  const sortedByTasks = [...tasksSummary].sort((a,b)=> b.tasks - a.tasks);
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
      tasksSummary.forEach(d => {
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
  }, [selectedSprint, dataTasks, dataHours, avgHoursPerDev, tasksSummary]);

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
            <Select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)} size="small" sx={{mr:1}}>
              <MenuItem value="">Todos</MenuItem>
              {sprintOptions.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2" sx={{ml:2}}>Usuario</Typography>
            <Select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} size="small">
              <MenuItem value="">Todos</MenuItem>
              {userOptions.map(u => (<MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>))}
            </Select>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{p:2, height:420}}>
            <Typography variant="subtitle1">Tareas completadas por developer por sprint</Typography>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={tasksChart.chartData} margin={{ top: 40, right: 30, left: 0, bottom: 5 }} barCategoryGap="18%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprintNombre" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {renderSeriesWithLabels(tasksChart.usersForChart)}
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{p:2, height:420}}>
            <Typography variant="subtitle1">Horas reales por developer por sprint</Typography>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={hoursChart.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barCategoryGap="18%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprintNombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                {renderSeries(hoursChart.usersForChart)}
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
