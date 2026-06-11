import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function EditTaskModal({ open, task, onClose, onSave, users, sprints }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIUM',
    estimacionHoras: '',
    horasReales: '',
    idUsuario: '',
    idSprint: '',
    idEstado: 1
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        titulo: task.titulo || task.description || '',
        descripcion: task.descripcion || task.description || '',
        prioridad: task.prioridad || 'MEDIUM',
        estimacionHoras: task.estimacionHoras != null ? task.estimacionHoras : '',
        horasReales: task.horasReales != null ? task.horasReales : '',
        idUsuario: task.idUsuario != null ? task.idUsuario : '',
        idSprint: task.idSprint != null ? task.idSprint : '',
        idEstado: task.idEstado || 1
      });
    }
  }, [task]);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo || formData.descripcion,
        descripcion: formData.descripcion || formData.titulo,
        prioridad: formData.prioridad,
        estimacionHoras: formData.estimacionHoras === '' ? null : Number(formData.estimacionHoras),
        horasReales: formData.horasReales === '' ? null : Number(formData.horasReales),
        idUsuario: formData.idUsuario === '' ? null : Number(formData.idUsuario),
        idSprint: formData.idSprint === '' ? null : Number(formData.idSprint),
        idEstado: Number(formData.idEstado)
      };
      await onSave(task.id, payload);
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
    }
    setSaving(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon color="primary" />
        Editar Tarea
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Titulo"
                value={formData.titulo}
                onChange={handleChange('titulo')}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Descripcion"
                value={formData.descripcion}
                onChange={handleChange('descripcion')}
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.prioridad}
                  onChange={handleChange('prioridad')}
                  label="Prioridad"
                >
                  <MenuItem value="LOW">Baja</MenuItem>
                  <MenuItem value="MEDIUM">Media</MenuItem>
                  <MenuItem value="HIGH">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Est. Horas"
                type="number"
                value={formData.estimacionHoras}
                onChange={handleChange('estimacionHoras')}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Horas Reales"
                type="number"
                value={formData.horasReales}
                onChange={handleChange('horasReales')}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.idEstado}
                  onChange={handleChange('idEstado')}
                  label="Estado"
                >
                  <MenuItem value={1}>Pendiente</MenuItem>
                  <MenuItem value={2}>En Progreso</MenuItem>
                  <MenuItem value={3}>Completada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Asignar Usuario</InputLabel>
                <Select
                  value={formData.idUsuario}
                  onChange={handleChange('idUsuario')}
                  label="Asignar Usuario"
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {users && users.length > 0 ? (
                    users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)
                  ) : null}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sprint</InputLabel>
                <Select
                  value={formData.idSprint}
                  onChange={handleChange('idSprint')}
                  label="Sprint"
                >
                  <MenuItem value="">Sin sprint</MenuItem>
                  {sprints && sprints.length > 0 ? (
                    sprints.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)
                  ) : null}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} startIcon={<CancelIcon />} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditTaskModal;
