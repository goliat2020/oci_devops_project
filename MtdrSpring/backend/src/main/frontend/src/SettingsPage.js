import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Button,
  Fade,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';

function SettingsPage({ onBack, users, sprints, onSprintsChange }) {
  const [sprintsToAdd, setSprintsToAdd] = useState(2);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddSprints = async () => {
    if (sprintsToAdd <= 0) return;
    setAdding(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/sprints/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: sprintsToAdd, idProyecto: 1 })
      });
      if (res.ok) {
        const created = await res.json();
        setSuccessMsg(`${created.length} sprint(s) agregados exitosamente.`);
        setSprintsToAdd(2);
        if (onSprintsChange) {
          onSprintsChange();
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Failed to add sprints', e);
    }
    setAdding(false);
  };

  const handleDeleteUser = (userId) => {
    console.log('Delete user:', userId);
  };

  return (
    <Fade in timeout={500}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <IconButton onClick={onBack} sx={{ color: 'text.primary' }}>
            <ArrowBackIcon />
          </IconButton>
          <SettingsIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
            Configuracion
          </Typography>
        </Stack>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {successMsg}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.4) 0%, rgba(17, 24, 39, 0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <TimelineIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Sprints del Proyecto
            </Typography>
            <Chip label={`${sprints.length} total`} size="small" sx={{ ml: 1 }} />
          </Stack>

          <Box sx={{ mb: 4, maxHeight: 200, overflowY: 'auto' }}>
            <List dense>
              {sprints.length > 0 ? (
                sprints.map((sprint, index) => (
                  <React.Fragment key={sprint.id}>
                    {index > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                    <ListItem sx={{ px: 2, py: 1 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="500">
                            {sprint.name}
                          </Typography>
                        }
                        secondary={
                          sprint.fechaInicio && sprint.fechaFin
                            ? `${sprint.fechaInicio} - ${sprint.fechaFin}`
                            : 'Sin fechas'
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                  No hay sprints creados.
                </Typography>
              )}
            </List>
          </Box>

          <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.05)' }} />

          <Typography variant="subtitle2" color="text.secondary" mb={2}>
            Agregar nuevos sprints
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              type="number"
              label="Cantidad a agregar"
              value={sprintsToAdd}
              onChange={(e) => setSprintsToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))}
              variant="outlined"
              size="small"
              sx={{ width: 180 }}
              inputProps={{ min: 1, max: 10 }}
            />
            <Button
              variant="contained"
              startIcon={adding ? null : <AddIcon />}
              onClick={handleAddSprints}
              disabled={adding || sprintsToAdd <= 0}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                height: 40
              }}
            >
              {adding ? 'Agregando...' : 'Agregar Sprints'}
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.4) 0%, rgba(17, 24, 39, 0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <Typography variant="h6" fontWeight="600" mb={3}>
            Usuarios del Proyecto
          </Typography>

          <List sx={{ width: '100%' }}>
            {users && users.length > 0 ? (
              users.map((user, index) => (
                <React.Fragment key={user.id}>
                  {index > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                  <ListItem
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': { background: 'rgba(255,255,255,0.03)' }
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleDeleteUser(user.id)}
                        size="small"
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 40,
                          height: 40,
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="500">
                          {user.name || 'Usuario'}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {user.email || 'Sin correo'}
                        </Typography>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No hay usuarios registrados.
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>

          <Box mt={3} display="flex" justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              disabled
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.2,
                textTransform: 'none',
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'text.disabled'
              }}
            >
              Agregar Integrante
            </Button>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}

export default SettingsPage;
