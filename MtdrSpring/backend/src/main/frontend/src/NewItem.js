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
    let mounted = true;
    const fetchData = async () => {
      try {
        // try canonical users endpoint
        const ures = await fetch('/users');
        if (ures.ok) {
          const udata = await ures.json();
          if (Array.isArray(udata) && udata.length > 0) {
            const mapped = udata.map(u => {
              const id = u.id ?? u.ID ?? u.Id ?? u.Id;
              const phone = u.phoneNumber ?? u.phonenumber ?? null;
              const name = u.name ?? u.nombre ?? u.userNombre ?? u.userName ?? phone ?? (id != null ? `User ${id}` : 'User');
              return { id, name, raw: u };
            });
            if (!mounted) return;
            setUsers(mapped);
            if (mapped.length > 0 && !idUsuario) setIdUsuario(mapped[0].id);
          }
        }
      } catch (e) {
        console.error('Failed fetching users for NewItem', e);
      }

      try {
        const kres = await fetch('/kpi/dashboard');
        if (kres.ok) {
          const payload = await kres.json();
          const tasks = payload.tasksCompletedByUserSprint || [];
          const hours = payload.realHoursByUserSprint || [];

          // build sprints
          const sprintMap = new Map();
          tasks.concat(hours).forEach(p => {
            if (p && (p.sprintId != null || p.sprintId === 0)) {
              sprintMap.set(p.sprintId, p.sprintNombre || `Sprint ${p.sprintId}`);
            }
          });
          const sList = Array.from(sprintMap.entries()).map(([id, name]) => ({ id, name }));
          if (mounted) {
            setSprints(sList);
            if (sList.length > 0 && !idSprint) setIdSprint(sList[0].id);
          }

          // if users not populated, derive from KPI payload
          if ((users == null || users.length === 0)) {
            const userMap = new Map();
            tasks.concat(hours).forEach(p => {
              if (p && (p.userId != null || p.userId === 0)) {
                userMap.set(p.userId, p.userNombre || `User ${p.userId}`);
              }
            });
            const uList = Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
            if (mounted && uList.length > 0) {
              setUsers(uList);
              if (!idUsuario) setIdUsuario(uList[0].id);
            }
          }
        }
      } catch (e) {
        console.error('Failed fetching KPI dashboard for NewItem', e);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []); // run once

  function clearForm() {
    setTitulo('');
    setDescripcion('');
    setPrioridad('MEDIUM');
    setEstimacionHoras('');
    setHorasReales('');
    // keep selected user/sprint
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // build payload matching backend ToDoItem fields
    const payload = {
      titulo: titulo || descripcion || '',
      descripcion: descripcion || titulo || '',
      prioridad,
      estimacionHoras: estimacionHoras === '' ? null : Number(estimacionHoras),
      horasReales: horasReales === '' ? null : Number(horasReales),
      idUsuario: idUsuario === '' ? null : Number(idUsuario),
      idSprint: idSprint === '' ? null : Number(idSprint)
    };

    try {
      // delegate creation to parent which uses API.create
      if (props.addItem) {
        props.addItem(payload);
      } else {
        // fallback: call API directly
        await API.create(payload);
      }
      clearForm();
    } catch (err) {
      console.error('Failed to submit new item', err);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField fullWidth size="small" label="Estimación horas" value={estimacionHoras} onChange={e => setEstimacionHoras(e.target.value)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField fullWidth size="small" label="Horas reales" value={horasReales} onChange={e => setHorasReales(e.target.value)} />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Usuario</InputLabel>
              <Select value={idUsuario} label="Usuario" onChange={e => setIdUsuario(e.target.value)}>
                {users && users.length > 0 ? (
                  users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)
                ) : (
                  <MenuItem value="">(Sin usuarios disponibles)</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sprint</InputLabel>
              <Select value={idSprint} label="Sprint" onChange={e => setIdSprint(e.target.value)}>
                {sprints && sprints.length > 0 ? (
                  sprints.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)
                ) : (
                  <MenuItem value="">(Sin sprints disponibles)</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <InputAdornment position="end">
              <IconButton aria-label="add" color="primary" type="submit" className="add-button" disabled={props.isInserting}>
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