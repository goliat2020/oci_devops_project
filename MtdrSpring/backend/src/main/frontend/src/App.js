import React, { useEffect, useState } from 'react';
import NewItem from './NewItem';
import API from './API';
import KpiDashboard from './KpiDashboard';
import AiPlanner from './AiPlanner';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UndoIcon from '@mui/icons-material/Undo';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
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
  Chip
} from '@mui/material';
import Moment from 'react-moment';

function App() {
  const [viewMode, setViewMode] = useState('tasks');
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();

  const errorMessage = typeof error === 'string' ? error : error?.message;

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
    modifyItem(id, description, done).then(
      () => { reloadOneIteam(id); },
      (err) => { setError(err); }
    );
  }

  function reloadOneIteam(id) {
    API.get(id).then(
      (result) => {
        setItems((previousItems) => previousItems.map(
          (item) => (item.id === id ? {
            ...item,
            description: result.description,
            done: result.done
          } : item)
        ));
      },
      (err) => { setError(err); }
    );
  }

  function modifyItem(id, description, done) {
    const data = { description, done };
    return API.update(id, data);
  }

  useEffect(() => {
    setLoading(true);
    API.list().then(
      (result) => { setLoading(false); setItems(result); },
      (err) => { setLoading(false); setError(err); }
    );
  }, []);

  function addItem(payload) {
    setInserting(true);
    let data;
    let displayDescription = '';

    if (typeof payload === 'string') {
      data = { description: payload };
      displayDescription = payload;
    } else if (typeof payload === 'object') {
      data = payload;
      displayDescription = payload.descripcion || payload.titulo || payload.description || '';
    } else {
      data = { description: String(payload) };
      displayDescription = String(payload);
    }

    API.create(data).then(
      (result) => {
        let newItem;
        if (result && result.headers && typeof result.headers.get === 'function') {
          const id = result.headers.get('location');
          newItem = { id, ...data, description: displayDescription };
        } else if (result && result.id) {
          newItem = result;
        } else {
          newItem = { id: String(Date.now()), ...data, description: displayDescription };
        }
        setItems((previousItems) => [newItem, ...previousItems]);
        setInserting(false);
      },
      (err) => { setInserting(false); setError(err); }
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sleek Navbar */}
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
          
          <Stack direction="row" spacing={2} sx={{ 
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
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 6, pb: 8, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'tasks' ? (
          <Fade in timeout={500}>
            <Box>
              {/* Header area */}
              <Box mb={5}>
                <Typography variant="h3" fontWeight="800" gutterBottom sx={{ letterSpacing: '-1px' }}>
                  Mis Proyectos
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Gestiona tus tareas y sprints con la máxima eficiencia.
                </Typography>
              </Box>

              {/* Input section */}
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

              {/* Loading & Empty States */}
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

              {/* Grid of Tasks */}
              <Grid container spacing={3}>
                {items.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Fade in timeout={300 + (index * 100)}>
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
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Chip 
                              label={item.done ? "Completado" : "Pendiente"} 
                              size="small"
                              variant={item.done ? "outlined" : "filled"}
                              color={item.done ? "default" : "primary"}
                              sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                            />
                            <Typography variant="caption" color="text.disabled">
                              <Moment format="MMM Do, YYYY">{item.createdAt}</Moment>
                            </Typography>
                          </Stack>
                          <Typography 
                            variant="body1" 
                            fontWeight="500" 
                            sx={{ 
                              textDecoration: item.done ? 'line-through' : 'none',
                              color: item.done ? 'text.secondary' : 'text.primary',
                              lineHeight: 1.6
                            }}
                          >
                            {item.description}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
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
              
              <Box mt={8}>
                <KpiDashboard />
              </Box>
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
    </Box>
  );
}

export default App;
