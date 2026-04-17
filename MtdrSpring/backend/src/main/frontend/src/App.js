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
import React, { useState, useEffect } from 'react';
import NewItem from './NewItem';
import API from './API';
import KpiDashboard from './KpiDashboard';
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
  Box
} from '@mui/material';
import Moment from 'react-moment';

/* In this application we're using Function Components with the State Hooks
 * to manage the states. See the doc: https://reactjs.org/docs/hooks-state.html
 * This App component represents the entire app. It renders a NewItem component
 * and two tables: one that lists the todo items that are to be done and another
 * one with the items that are already done.
 */
function App() {
    // isLoading is true while waiting for the backend to return the list
    // of items. We use this state to display a spinning circle:
    const [isLoading, setLoading] = useState(false);
    // Similar to isLoading, isInserting is true while waiting for the backend
    // to insert a new item:
    const [isInserting, setInserting] = useState(false);
    // The list of todo items is stored in this state. It includes the "done"
    // "not-done" items:
    const [items, setItems] = useState([]);
    // In case of an error during the API call:
    const [error, setError] = useState();

    function deleteItem(deleteId) {
      API.remove(deleteId).then(
        () => {
          const remainingItems = items.filter(item => item.id !== deleteId);
          setItems(remainingItems);
        },
        (error) => { setError(error); }
      );
    }
    function toggleDone(event, id, description, done) {
      event.preventDefault();
      modifyItem(id, description, done).then(
        (result) => { reloadOneIteam(id); },
        (error) => { setError(error); }
      );
    }
    function reloadOneIteam(id){
      API.get(id).then(
        (result) => {
          const items2 = items.map(
            x => (x.id === id ? {
               ...x,
               'description':result.description,
               'done': result.done
              } : x));
          setItems(items2);
        },
        (error) => { setError(error); }
      );
    }
    function modifyItem(id, description, done) {
      var data = {"description": description, "done": done};
      return API.update(id, data);
    }
    /*
    To simulate slow network, call sleep before making API calls.
    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    */
    useEffect(() => {
      setLoading(true);
      // sleep(5000).then(() => {
      API.list().then(
        (result) => { setLoading(false); setItems(result); },
        (error) => { setLoading(false); setError(error); }
      );

      //})
    },
    // https://en.reactjs.org/docs/faq-ajax.html
    [] // empty deps array [] means
       // this useEffect will run once
       // similar to componentDidMount()
    );
    function addItem(payload){
      // payload can be a simple string (old UI) or an object with full ToDoItem fields
      console.log("addItem("+JSON.stringify(payload)+")")
      setInserting(true);
      let data;
      let displayDescription = '';
      if (typeof payload === 'string') {
        data = { description: payload };
        displayDescription = payload;
      } else if (typeof payload === 'object') {
        // pass the object as-is (API.create mock handles full shape)
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
            newItem = { id: id, description: displayDescription };
          } else if (result && result.id) {
            newItem = result;
          } else {
            newItem = { id: String(Date.now()), description: displayDescription };
          }
          setItems([newItem, ...items]);
          setInserting(false);
        },
        (error) => { setInserting(false); setError(error); }
      );
    }
    return (
      <div className="App">
        <AppBar position="static" elevation={1} sx={{ backgroundColor: '#CA0000', color: '#fff' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} className="appbar-title">
              Oracle Project Admin
            </Typography>
            <Typography variant="body2" color="textSecondary">Team dashboard</Typography>
          </Toolbar>
        </AppBar>
        <Container className="app-container">
          <Box className="hero">
            <Typography variant="h4" gutterBottom>My Todo List</Typography>
            <Typography variant="body2" color="textSecondary">A modernized interface to manage your tasks quickly. Use the input below to add tasks.</Typography>
          </Box>

          <Paper variant="outlined" className="task-card" sx={{padding:2, marginBottom:2}}>
            <NewItem addItem={addItem} isInserting={isInserting} />
          </Paper>

          { error && <Typography color="error">Error: {error.message}</Typography> }

          { isLoading && <Box sx={{display:'flex', justifyContent:'center', p:4}}><CircularProgress /></Box> }

          { !isLoading && items.length === 0 && (
            <Paper className="task-card empty-state">
              <Typography>No tasks yet. Add your first task above.</Typography>
            </Paper>
          )}

          <Grid container spacing={2}>
            {items.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card className="task-card">
                  <CardContent>
                    <Typography className="task-desc">{item.description}</Typography>
                    <Typography className="task-meta"><Moment format="MMM Do YYYY, hh:mm">{item.createdAt}</Moment></Typography>
                  </CardContent>
                  <CardActions>
                    <div className="task-actions">
                      <IconButton color="primary" aria-label="toggle-done" onClick={(event) => toggleDone(event, item.id, item.description, !item.done)}>
                        {item.done ? <UndoIcon /> : <CheckIcon />}
                      </IconButton>
                      <Button startIcon={<DeleteIcon />} color="error" onClick={() => deleteItem(item.id)}>Delete</Button>
                    </div>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* KPI Dashboard for Tasks / Hours */}
          <KpiDashboard />

        </Container>
      </div>
    );
}
export default App;
