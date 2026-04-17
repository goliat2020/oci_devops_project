/*
## MyToDoReact version 1.0.
##
## Copyright (c) 2022 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/
/*
 * Component that supports creating a new todo item.
 * @author  jean.de.lavarene@oracle.com
 */

import React, { useState, useEffect } from "react";
import { TextField, InputAdornment, IconButton, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import API from './API';

function NewItem(props) {
  // richer form matching ToDoItem.java
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('MEDIUM');
  const [estimacionHoras, setEstimacionHoras] = useState('');
  const [horasReales, setHorasReales] = useState('');
  const [idUsuario, setIdUsuario] = useState('');
  const [idSprint, setIdSprint] = useState('');
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);

  useEffect(() => {
    // If running mock, derive users/sprints from API mock data if available
    if (process.env.REACT_APP_USE_MOCK === 'true') {
      const mockUsers = [ { id:1, name:'Alice' }, { id:2, name:'Bob' }, { id:3, name:'Carlos' }, { id:4, name:'Diana' } ];
      const mockSprints = [ { id:1, name:'Sprint 1' }, { id:2, name:'Sprint 2' } ];
      setUsers(mockUsers);
      setSprints(mockSprints);
      setIdUsuario(mockUsers[0].id);
      setIdSprint(mockSprints[0].id);
    } else {
      // Optionally fetch available users/sprints from backend endpoints if exist
      // For now just leave empty; user can type ids.
    }
  }, []);

  function clearForm() {
    setTitulo(''); setDescripcion(''); setPrioridad('MEDIUM'); setEstimacionHoras(''); setHorasReales('');
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!titulo.trim() && !descripcion.trim()) return;
    const payload = {
      titulo: titulo || descripcion,
      descripcion: descripcion || titulo,
      prioridad: prioridad,
      estimacionHoras: estimacionHoras ? Number(estimacionHoras) : null,
      horasReales: horasReales ? Number(horasReales) : null,
      idUsuario: idUsuario ? Number(idUsuario) : null,
      idSprint: idSprint ? Number(idSprint) : null
    };
    // call parent addItem which uses API.create under the hood
    props.addItem(payload);
    clearForm();
  }

  return (
    <div id="newinputform" className="newinput-row">
      <form style={{width:'100%'}} onSubmit={handleSubmit}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField label="Título" value={titulo} onChange={e=>setTitulo(e.target.value)} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Descripción" value={descripcion} onChange={e=>setDescripcion(e.target.value)} size="small" fullWidth />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Prioridad</InputLabel>
              <Select value={prioridad} label="Prioridad" onChange={e=>setPrioridad(e.target.value)}>
                <MenuItem value="LOW">LOW</MenuItem>
                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                <MenuItem value="HIGH">HIGH</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField label="Estimación (h)" value={estimacionHoras} onChange={e=>setEstimacionHoras(e.target.value)} size="small" fullWidth />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField label="Horas reales" value={horasReales} onChange={e=>setHorasReales(e.target.value)} size="small" fullWidth />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Usuario</InputLabel>
              <Select value={idUsuario} label="Usuario" onChange={e=>setIdUsuario(e.target.value)}>
                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sprint</InputLabel>
              <Select value={idSprint} label="Sprint" onChange={e=>setIdSprint(e.target.value)}>
                {sprints.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <InputAdornment position="end">
              <IconButton aria-label="add" color="primary" onClick={handleSubmit} disabled={props.isInserting}>
                <AddIcon />
              </IconButton>
            </InputAdornment>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}

export default NewItem;