import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import API from './API';

const normalizeNumber = (value, fallback = null) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toCreatePayload = (task, defaults = {}) => ({
  titulo: task.titulo || task.title || task.descripcion || task.description || 'Tarea generada',
  descripcion: task.descripcion || task.description || task.titulo || task.title || 'Tarea generada por IA',
  prioridad: task.prioridad || 'MEDIUM',
  estimacionHoras: normalizeNumber(task.estimacionHoras, 2),
  horasReales: normalizeNumber(task.horasReales, 0),
  idUsuario: normalizeNumber(task.idUsuario, defaults.defaultUserId),
  idSprint: normalizeNumber(task.idSprint, defaults.defaultSprintId),
  idProyecto: normalizeNumber(task.idProyecto, defaults.defaultProjectId),
  idEstado: normalizeNumber(task.idEstado, 1),
  done: false
});

function AiPlanner(props) {
  const [prompt, setPrompt] = useState('Construye un panel para gestionar reservas de un laboratorio, con autenticación, calendario, recordatorios y reportes.');
  const [taskCount, setTaskCount] = useState(6);
  const [defaultUserId, setDefaultUserId] = useState('');
  const [defaultSprintId, setDefaultSprintId] = useState('');
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const DEFAULT_PROJECT_ID = 1;

  const defaults = useMemo(() => ({
    defaultUserId: normalizeNumber(defaultUserId, null),
    defaultSprintId: normalizeNumber(defaultSprintId, null),
    defaultProjectId: DEFAULT_PROJECT_ID
  }), [defaultUserId, defaultSprintId]);

  useEffect(() => {
    let mounted = true;

    const fetchCatalogs = async () => {
      try {
        const dashboardResponse = await fetch('/kpi/dashboard');
        if (dashboardResponse.ok) {
          const dashboard = await dashboardResponse.json();
          const userMap = new Map();
          const sprintMap = new Map();

          const processPoint = (point) => {
            if (point && point.userId != null) {
              userMap.set(point.userId, point.userNombre || `Usuario ${point.userId}`);
            }
            if (point && (point.sprintId != null || point.sprintId === 0)) {
              sprintMap.set(point.sprintId, point.sprintNombre || `Sprint ${point.sprintId}`);
            }
          };

          (dashboard.tasksCompletedByUserSprint || []).forEach(processPoint);
          (dashboard.realHoursByUserSprint || []).forEach(processPoint);

          if (mounted) {
            const usersList = Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
            const sprintsList = Array.from(sprintMap.entries()).map(([id, name]) => ({ id, name }));
            setUsers(usersList);
            setSprints(sprintsList);
            if (usersList.length > 0 && !defaultUserId) {
              setDefaultUserId(String(usersList[0].id));
            }
            if (sprintsList.length > 0 && !defaultSprintId) {
              setDefaultSprintId(String(sprintsList[0].id));
            }
          }
        }
      } catch (catalogError) {
        console.error('Failed fetching KPI dashboard for AI planner', catalogError);
      }
    };

    fetchCatalogs();
    return () => {
      mounted = false;
    };
  }, []);

  const resolveUserName = (value) => {
    const numericValue = normalizeNumber(value, null);
    if (numericValue == null) {
      return 'Sin definir';
    }
    const match = users.find((user) => String(user.id) === String(numericValue));
    return match ? match.name : `Usuario ${numericValue}`;
  };

  const resolveSprintName = (value) => {
    const numericValue = normalizeNumber(value, null);
    if (numericValue == null) {
      return 'Sin definir';
    }
    const match = sprints.find((sprint) => String(sprint.id) === String(numericValue));
    return match ? match.name : `Sprint ${numericValue}`;
  };

  const resolveProjectName = (value) => {
    return 'Proyecto principal';
  };

  const selectedUserLabel = resolveUserName(defaultUserId);
  const selectedSprintLabel = resolveSprintName(defaultSprintId);
  const selectedProjectLabel = 'Proyecto principal';

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Escribe una tarea grande para que Gemini la desmenuce.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await API.generatePlan({
        prompt,
        taskCount: normalizeNumber(taskCount, 6),
        defaultUserId: defaults.defaultUserId,
        defaultSprintId: defaults.defaultSprintId,
        defaultProjectId: defaults.defaultProjectId
      });
      setTasks(Array.isArray(response) ? response : []);
    } catch (e) {
      setError(e.message || 'No se pudo generar el plan.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOne = async (task) => {
    try {
      await props.onAddTask(toCreatePayload(task, defaults));
    } catch (e) {
      setError(e.message || 'No se pudo agregar la tarea.');
    }
  };

  const handleAddAll = async () => {
    if (tasks.length === 0) {
      return;
    }
    for (const task of tasks) {
      // Sequential insertion avoids saturating the backend and preserves order.
      // eslint-disable-next-line no-await-in-loop
      await handleAddOne(task);
    }
  };

  return (
    <Box>
      <Box className="hero ai-hero">
        <Typography variant="h4" gutterBottom>Asistente de IA</Typography>
        <Typography variant="body2" color="textSecondary">
          Escribe una tarea grande y Gemini la convierte en tareas pequeñas listas para guardar.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" className="task-card ai-panel" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Tarea grande"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              multiline
              minRows={5}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Cantidad de tareas"
              type="number"
              value={taskCount}
              onChange={(e) => setTaskCount(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Usuario por defecto</InputLabel>
              <Select
                value={defaultUserId}
                label="Usuario por defecto"
                onChange={(e) => setDefaultUserId(e.target.value)}
              >
                {users.length > 0 ? users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                )) : (
                  <MenuItem value="1">Usuario 1</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sprint por defecto</InputLabel>
              <Select
                value={defaultSprintId}
                label="Sprint por defecto"
                onChange={(e) => setDefaultSprintId(e.target.value)}
              >
                {sprints.length > 0 ? sprints.map((sprint) => (
                  <MenuItem key={sprint.id} value={sprint.id}>{sprint.name}</MenuItem>
                )) : (
                  <MenuItem value="1">Sprint 1</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Proyecto
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {selectedProjectLabel}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="contained" onClick={handleGenerate} disabled={loading}>
                {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Generar plan'}
              </Button>
              <Button variant="outlined" onClick={handleAddAll} disabled={tasks.length === 0}>
                Agregar todas
              </Button>
              <Button variant="text" onClick={props.onBack}>
                Volver al tablero
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {tasks.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${tasks.length} tareas generadas`} color="primary" variant="outlined" />
            <Chip label="Campos listos para la BD" color="success" variant="outlined" />
            <Chip label={`Usuario: ${selectedUserLabel}`} variant="outlined" />
            <Chip label={`Sprint: ${selectedSprintLabel}`} variant="outlined" />
            <Chip label={`Proyecto: ${selectedProjectLabel}`} variant="outlined" />
          </Stack>

          <Grid container spacing={2}>
            {tasks.map((task, index) => (
              <Grid item xs={12} md={6} key={`${task.titulo || task.descripcion || index}-${index}`}>
                <Card className="task-card ai-task-card">
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={task.prioridad || 'MEDIUM'} />
                      <Chip size="small" label={`${normalizeNumber(task.estimacionHoras, 2)} h`} />
                    </Stack>
                    <Typography className="task-desc">{task.titulo || task.descripcion}</Typography>
                    <Typography className="task-meta" sx={{ mt: 1 }}>
                      {task.descripcion || task.titulo}
                    </Typography>
                    <Typography className="task-meta" sx={{ mt: 1 }}>
                      Usuario: {resolveUserName(task.idUsuario ?? task.userId ?? task.userNombre)} | Sprint: {resolveSprintName(task.idSprint ?? task.sprintId ?? task.sprintNombre)} | Proyecto: {resolveProjectName(task.idProyecto)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button variant="contained" onClick={() => handleAddOne(task)}>
                      Agregar tarea
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default AiPlanner;