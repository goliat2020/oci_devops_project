import React, { useState, useEffect } from "react";
import { 
  TextField, 
  IconButton, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Typography,
  Box,
  Button
} from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import API from './API';

function NewItem(props) {
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
  }, []); 

  function clearForm() {
    setTitulo('');
    setDescripcion('');
    setPrioridad('MEDIUM');
    setEstimacionHoras('');
    setHorasReales('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
      if (props.addItem) {
        props.addItem(payload);
      } else {
        await API.create(payload);
      }
      clearForm();
    } catch (err) {
      console.error('Failed to submit new item', err);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box mb={3} display="flex" alignItems="center" gap={1.5}>
        <AddTaskIcon color="primary" />
        <Typography variant="h6" fontWeight="600">
          Nueva Tarea
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField 
            fullWidth 
            label="Título" 
            variant="filled"
            value={titulo} 
            onChange={e => setTitulo(e.target.value)} 
            InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField 
            fullWidth 
            label="Descripción detallada" 
            variant="filled"
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)} 
            InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField 
            fullWidth 
            label="Est. horas" 
            variant="filled"
            type="number"
            value={estimacionHoras} 
            onChange={e => setEstimacionHoras(e.target.value)} 
            InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField 
            fullWidth 
            label="Horas reales" 
            variant="filled"
            type="number"
            value={horasReales} 
            onChange={e => setHorasReales(e.target.value)} 
            InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <FormControl fullWidth variant="filled" sx={{ '& .MuiFilledInput-root': { borderRadius: 2, '&::before, &::after': { display: 'none' } } }}>
            <InputLabel>Asignar Usuario</InputLabel>
            <Select 
              value={idUsuario} 
              onChange={e => setIdUsuario(e.target.value)}
              disableUnderline
            >
              {users && users.length > 0 ? (
                users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)
              ) : (
                <MenuItem value="">(Sin usuarios)</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3}>
          <FormControl fullWidth variant="filled" sx={{ '& .MuiFilledInput-root': { borderRadius: 2, '&::before, &::after': { display: 'none' } } }}>
            <InputLabel>Sprint</InputLabel>
            <Select 
              value={idSprint} 
              onChange={e => setIdSprint(e.target.value)}
              disableUnderline
            >
              {sprints && sprints.length > 0 ? (
                sprints.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)
              ) : (
                <MenuItem value="">(Sin sprints)</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              size="large"
              disabled={props.isInserting || (!titulo && !descripcion)}
              startIcon={<AddTaskIcon />}
              sx={{ px: 4, py: 1.2 }}
            >
              Añadir Tarea
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewItem;
