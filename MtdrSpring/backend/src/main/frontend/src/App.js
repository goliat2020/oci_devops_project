import React, { useEffect, useState, useMemo } from 'react';
import NewItem from './NewItem';
import API from './API';
import KpiDashboard from './KpiDashboard';
import AiPlanner from './AiPlanner';
import AuthPage from './AuthPage';
import EditTaskModal from './EditTaskModal';
import SettingsPage from './SettingsPage';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UndoIcon from '@mui/icons-material/Undo';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  Button,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Box,
  Stack,
  Fade,
  Alert,
  Chip,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Moment from 'react-moment';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [viewMode, setViewMode] = useState('tasks');
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();
  const [editingTask, setEditingTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const errorMessage = typeof error === 'string' ? error : error?.message;

  const fetchSprints = async () => {
    try {
      const sres = await fetch('/sprints');
      if (sres.ok) {
        const sdata = await sres.json();
        if (Array.isArray(sdata)) {
          const sList = sdata.map(s => ({
            id: s.idSprint,
            name: s.nombre,
            fechaInicio: s.fechaInicio,
            fechaFin: s.fechaFin
          }));
          setSprints(sList);
          const initialExpanded = {};
          sList.forEach(s => { initialExpanded[s.id] = true; });
          setExpandedSprints(initialExpanded);
        }
      }
    } catch (e) {
      console.error('Failed fetching sprints', e);
    }
  };

  useEffect(() => {
    API.checkAuth().then((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    API.list().then(
      (result) => { setLoading(false); setItems(result); },
      (err) => { setLoading(false); setError(err); }
    );
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchAll = async () => {
      try {
        const ures = await fetch('/api/users');
        if (ures.ok) {
          const udata = await ures.json();
          if (Array.isArray(udata) && udata.length > 0) {
            const mapped = udata.map(u => ({
              id: u.id,
              name: u.nombre,
              email: u.email,
              raw: u
            }));
            setUsers(mapped);
          }
        }
      } catch (e) {
        console.error('Failed fetching users', e);
      }

      await fetchSprints();
    };
    fetchAll();
  }, [currentUser]);

  const sprintGroups = useMemo(() => {
    const sprintMap = new Map();
    const noSprintKey = '__no_sprint__';

    items.forEach(item => {
      const key = item.idSprint != null ? item.idSprint : noSprintKey;
      if (!sprintMap.has(key)) {
        sprintMap.set(key, []);
      }
      sprintMap.get(key).push(item);
    });

    const sprintOrder = new Map();
    sprints.forEach((s, idx) => {
      sprintOrder.set(s.id, idx);
    });

    const groups = Array.from(sprintMap.entries()).map(([sprintId, tasks]) => {
      const sprintInfo = sprints.find(s => s.id === sprintId);
      return {
        sprintId,
        sprintName: sprintInfo ? sprintInfo.name : 'Sin Sprint',
        fechaInicio: sprintInfo ? sprintInfo.fechaInicio : null,
        fechaFin: sprintInfo ? sprintInfo.fechaFin : null,
        tasks,
        order: sprintOrder.has(sprintId) ? sprintOrder.get(sprintId) : 9999
      };
    });

    groups.sort((a, b) => a.order - b.order);
    return groups;
  }, [items, sprints]);

  const toggleSprint = (sprintId) => {
    setExpandedSprints(prev => ({ ...prev, [sprintId]: !prev[sprintId] }));
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setAuthChecked(true);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    await API.logout();
    setCurrentUser(null);
    setItems([]);
    setViewMode('tasks');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleGoToSettings = () => {
    setAnchorEl(null);
    setViewMode('settings');
  };

  function deleteItem(deleteId) {
    API.remove(deleteId).then(
      () => {
        setItems((previousItems) => previousItems.filter((item) => item.id !== deleteId));
      },
      (err) => { setError(err); }
    );
  }

  function toggleDone(event, id, description, done) {
    event.preventDefault();
    const data = { description, done };
    API.update(id, data).then(
      () => {
        API.get(id).then((result) => {
          setItems((previousItems) => previousItems.map(
            (item) => (item.id === id ? { ...item, ...result } : item)
          ));
        });
      },
      (err) => { setError(err); }
    );
  }

  async function handleEditTask(id, payload) {
    await API.update(id, payload);
    const updated = await API.get(id);
    setItems((previousItems) => previousItems.map(
      (item) => (item.id === id ? { ...item, ...updated } : item)
    ));
  }

  function addItem(payload) {
    setInserting(true);
    const data = typeof payload === 'object' ? payload : { description: String(payload) };

    API.create(data).then(
      (result) => {
        let newItem;
        if (result && result.headers && typeof result.headers.get === 'function') {
          const id = result.headers.get('location');
          newItem = { id, ...data };
        } else if (result && result.id) {
          newItem = result;
        } else {
          newItem = { id: String(Date.now()), ...data };
        }
        setItems((previousItems) => [newItem, ...previousItems]);
        setInserting(false);
      },
      (err) => { setInserting(false); setError(err); }
    );
  }

  if (!authChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(11, 15, 25, 0.7)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <TaskAltIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: '-0.5px' }}>
              Oracle Planner
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ 
            background: 'rgba(255,255,255,0.03)', 
            p: 0.5, 
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <Button
              size="small"
              disableElevation
              variant={viewMode === 'tasks' ? 'contained' : 'text'}
              onClick={() => setViewMode('tasks')}
              startIcon={<TaskAltIcon />}
              sx={{ color: viewMode === 'tasks' ? '#fff' : 'text.secondary', borderRadius: '8px' }}
            >
              Tablero
            </Button>
            <Button
              size="small"
              disableElevation
              variant={viewMode === 'ai' ? 'contained' : 'text'}
              onClick={() => setViewMode('ai')}
              startIcon={<SmartToyIcon />}
              sx={{ color: viewMode === 'ai' ? '#fff' : 'text.secondary', borderRadius: '8px' }}
            >
              Control AI
            </Button>
          </Stack>

          <Box>
            <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 36,
                  height: 36,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  bgcolor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  minWidth: 200,
                  backdropFilter: 'blur(12px)'
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleGoToSettings} sx={{ py: 1.5, px: 2 }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="body2">Configuracion</Typography>
                </ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2 }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="body2" color="error">Cerrar sesion</Typography>
                </ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 6, pb: 8, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'tasks' ? (
          <Fade in timeout={500}>
            <Box>
              <Box mb={5}>
                <Typography variant="h3" fontWeight="800" gutterBottom sx={{ letterSpacing: '-1px' }}>
                  Mis Proyectos
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Gestiona tus tareas y sprints con la maxima eficiencia.
                </Typography>
              </Box>

              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 5, 
                  borderRadius: 3,
                  background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.4) 0%, rgba(17, 24, 39, 0.2) 100%)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <NewItem addItem={addItem} isInserting={isInserting} />
              </Paper>

              {errorMessage && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{errorMessage}</Alert>
              )}

              {isLoading && (
                <Box display="flex" justifyContent="center" p={6}>
                  <CircularProgress size={40} thickness={4} />
                </Box>
              )}

              {!isLoading && items.length === 0 && !errorMessage && (
                <Paper 
                  elevation={0} 
                  sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent' }}
                >
                  <TaskAltIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No tienes tareas pendientes.</Typography>
                  <Typography variant="body2" color="text.disabled">Agrega una arriba para comenzar.</Typography>
                </Paper>
              )}

              {sprintGroups.map((group) => (
                <Box key={group.sprintId} sx={{ mb: 4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      onClick={() => toggleSprint(group.sprintId)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 3,
                        py: 2,
                        cursor: 'pointer',
                        '&:hover': { background: 'rgba(255,255,255,0.03)' },
                        transition: 'background 0.2s'
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: '-0.5px' }}>
                          {group.sprintName}
                        </Typography>
                        <Chip
                          label={`${group.tasks.length} tarea${group.tasks.length !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                        />
                        {group.fechaInicio && group.fechaFin && (
                          <Typography variant="caption" color="text.disabled">
                            <Moment format="MMM D">{group.fechaInicio}</Moment>
                            {' - '}
                            <Moment format="MMM D, YYYY">{group.fechaFin}</Moment>
                          </Typography>
                        )}
                      </Stack>
                      <IconButton size="small">
                        {expandedSprints[group.sprintId] !== false ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    <Collapse in={expandedSprints[group.sprintId] !== false} timeout="auto">
                      <Box sx={{ px: 3, pb: 3 }}>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                          {group.tasks.map((item, index) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                              <Fade in timeout={300 + (index * 80)}>
                                <Card 
                                  elevation={0}
                                  sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    borderRadius: 3,
                                    transition: 'all 0.2s ease',
                                    opacity: item.done ? 0.6 : 1,
                                    border: item.done ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(255,255,255,0.08)',
                                    '&:hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: '0 12px 24px -10px rgba(0,0,0,0.5)',
                                      borderColor: item.done ? 'rgba(255,255,255,0.02)' : 'primary.main',
                                      opacity: 1
                                    }
                                  }}
                                >
                                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                      <Chip 
                                        label={item.done ? "Completado" : "Pendiente"} 
                                        size="small"
                                        variant={item.done ? "outlined" : "filled"}
                                        color={item.done ? "default" : "primary"}
                                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                                      />
                                      {item.prioridad && (
                                        <Chip
                                          label={item.prioridad === 'HIGH' ? 'Alta' : item.prioridad === 'LOW' ? 'Baja' : 'Media'}
                                          size="small"
                                          color={item.prioridad === 'HIGH' ? 'error' : item.prioridad === 'LOW' ? 'default' : 'warning'}
                                          sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                                        />
                                      )}
                                    </Stack>

                                    <Typography 
                                      variant="body1" 
                                      fontWeight="600" 
                                      sx={{ 
                                        textDecoration: item.done ? 'line-through' : 'none',
                                        color: item.done ? 'text.secondary' : 'text.primary',
                                        lineHeight: 1.5,
                                        mb: 0.5
                                      }}
                                    >
                                      {item.titulo || item.description}
                                    </Typography>

                                    {item.descripcion && item.descripcion !== item.titulo && (
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: 'text.disabled',
                                          fontSize: '0.8rem',
                                          lineHeight: 1.4,
                                          mb: 1.5,
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {item.descripcion}
                                      </Typography>
                                    )}

                                    <Stack spacing={0.5}>
                                      {item.fechaFinEstimada && (
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                          <EventAvailableIcon sx={{ fontSize: 14, color: 'info.main' }} />
                                          <Typography variant="caption" color="info.main" sx={{ fontWeight: 500 }}>
                                            Est: <Moment format="MMM D, YYYY">{item.fechaFinEstimada}</Moment>
                                          </Typography>
                                        </Stack>
                                      )}
                                      {item.fechaFinReal && (
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                          <CalendarTodayIcon sx={{ fontSize: 14, color: item.done ? 'success.main' : 'warning.main' }} />
                                          <Typography variant="caption" sx={{ color: item.done ? 'success.main' : 'warning.main', fontWeight: 500 }}>
                                            Real: <Moment format="MMM D, YYYY">{item.fechaFinReal}</Moment>
                                          </Typography>
                                        </Stack>
                                      )}
                                    </Stack>
                                  </CardContent>
                                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => setEditingTask(item)}
                                      title="Editar tarea"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color={item.done ? 'default' : 'success'}
                                      onClick={(event) => toggleDone(event, item.id, item.description, !item.done)}
                                    >
                                      {item.done ? <UndoIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      color="error" 
                                      onClick={() => deleteItem(item.id)}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </CardActions>
                                </Card>
                              </Fade>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>
                </Box>
              ))}
              
              <Box mt={8}>
                <KpiDashboard />
              </Box>
            </Box>
          </Fade>
        ) : viewMode === 'settings' ? (
          <Fade in timeout={500}>
            <Box sx={{ flex: 1 }}>
              <SettingsPage onBack={() => setViewMode('tasks')} users={users} sprints={sprints} onSprintsChange={fetchSprints} />
            </Box>
          </Fade>
        ) : (
          <Fade in timeout={500}>
            <Box sx={{ flex: 1 }}>
              <AiPlanner onAddTask={addItem} onBack={() => setViewMode('tasks')} />
            </Box>
          </Fade>
        )}
      </Container>

      <EditTaskModal
        open={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEditTask}
        users={users}
        sprints={sprints.map(s => ({ id: s.id, name: s.name }))}
      />
    </Box>
  );
}

export default App;
