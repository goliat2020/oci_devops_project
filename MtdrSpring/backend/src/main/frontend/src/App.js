/*
## MyToDoReact version 1.0.
##
## Copyright (c) 2022 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/
/*
 * This is the application main React component. We're using "function"
 * components in this application. No "class" components should be used for
 * consistency.
 * @author  jean.de.lavarene@oracle.com
 */
import React, { useEffect, useState } from 'react';
import NewItem from './NewItem';
import API from './API';
import KpiDashboard from './KpiDashboard';
import AiPlanner from './AiPlanner';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import UndoIcon from '@mui/icons-material/Undo';
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
  Stack
} from '@mui/material';
import Grow from '@mui/material/Grow';
import Moment from 'react-moment';

/* In this application we're using Function Components with the State Hooks
 * to manage the states. See the doc: https://reactjs.org/docs/hooks-state.html
 * This App component represents the entire app. It renders a NewItem component
 * and two tables: one that lists the todo items that are to be done and another
 * one with the items that are already done.
 */
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
    console.log(`addItem(${JSON.stringify(payload)})`);
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
    <div className="App">
      <AppBar
        position="static"
        elevation={1}
        className="appbar"
        sx={{ background: 'linear-gradient(90deg,#7c3aed,#d94c4c)', color: '#fff' }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} className="appbar-title">
            Oracle Project Admin
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              variant={viewMode === 'tasks' ? 'outlined' : 'text'}
              onClick={() => setViewMode('tasks')}
            >
              Tablero
            </Button>
            <Button
              color="inherit"
              variant={viewMode === 'ai' ? 'outlined' : 'text'}
              onClick={() => setViewMode('ai')}
            >
              IA
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container className="app-container">
        {viewMode === 'tasks' ? (
          <>
            <Box className="hero">
              <Typography variant="h4" gutterBottom>Mi Lista de Tareas</Typography>
              <Typography variant="body2" color="textSecondary">
                Organiza tu trabajo. Añade, marca como hecho o elimina tareas con facilidad.
              </Typography>
            </Box>

            <Paper variant="outlined" className="task-card" sx={{ padding: 2, marginBottom: 2 }}>
              <NewItem addItem={addItem} isInserting={isInserting} />
            </Paper>

            {errorMessage && <Typography color="error">Error: {errorMessage}</Typography>}

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!isLoading && items.length === 0 && (
              <Paper className="task-card empty-state">
                <Typography>No tasks yet. Add your first task above.</Typography>
              </Paper>
            )}

            <Grid container spacing={2}>
              {items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Grow in timeout={300 + (index * 80)}>
                    <div>
                      <Card className={`task-card ${item.done ? 'done' : ''} animate`}>
                        <CardContent>
                          <Typography className="task-desc">{item.description}</Typography>
                          <Typography className="task-meta">
                            <Moment format="MMM Do YYYY, hh:mm">{item.createdAt}</Moment>
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <div className="task-actions">
                            <IconButton
                              color="primary"
                              aria-label="toggle-done"
                              onClick={(event) => toggleDone(event, item.id, item.description, !item.done)}
                            >
                              {item.done ? <UndoIcon /> : <CheckIcon />}
                            </IconButton>
                            <Button startIcon={<DeleteIcon />} color="error" onClick={() => deleteItem(item.id)}>
                              Eliminar
                            </Button>
                          </div>
                        </CardActions>
                      </Card>
                    </div>
                  </Grow>
                </Grid>
              ))}
            </Grid>

            <KpiDashboard />
          </>
        ) : (
          <AiPlanner onAddTask={addItem} onBack={() => setViewMode('tasks')} />
        )}
      </Container>
    </div>
  );
}

export default App;
