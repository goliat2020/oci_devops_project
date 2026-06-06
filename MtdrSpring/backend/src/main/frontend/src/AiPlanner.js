import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, CircularProgress, Alert,
  Card, CardContent, Divider, Chip, Stack, List, ListItem, ListItemText, ListItemIcon, IconButton, Grid
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import AddTaskIcon from '@mui/icons-material/AddTask';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbCircleIcon from '@mui/icons-material/LightbulbCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function AiPlanner({ onAddTask, onBack }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  
  const [defaultUserId, setDefaultUserId] = useState(null);
  const [defaultSprintId, setDefaultSprintId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadMetadata = async () => {
      try {
        const ures = await fetch('/users');
        if (ures.ok) {
          const udata = await ures.json();
          if (mounted && Array.isArray(udata)) {
            setUsers(udata);
            if (udata.length > 0) setDefaultUserId(udata[0].id || udata[0].ID);
          }
        }
        
        const kres = await fetch('/kpi/dashboard');
        if (kres.ok) {
          const payload = await kres.json();
          const pTasks = payload.tasksCompletedByUserSprint || [];
          const pHours = payload.realHoursByUserSprint || [];
          const sMap = new Map();
          pTasks.concat(pHours).forEach(p => {
             if (p && p.sprintId != null) {
               sMap.set(p.sprintId, p.sprintNombre || `Sprint ${p.sprintId}`);
             }
          });
          if (mounted && sMap.size > 0) {
            const arr = Array.from(sMap.keys());
            setDefaultSprintId(arr[0]);
          }
        }
      } catch (err) {
        console.warn("Could not load users/sprints for AI Planner", err);
      }
    };
    loadMetadata();
    return () => { mounted = false; };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
       const res = await fetch('/ai/plan', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ prompt: prompt.trim() })
       });
       
       if (!res.ok) {
         throw new Error(`Error ${res.status}: ${res.statusText}`);
       }
       
       const data = await res.json();
       setResult(data);
    } catch (err) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  const handleAddAll = async () => {
     if (!result || !result.tasks) return;
     let successCount = 0;
     for (const t of result.tasks) {
        const payload = {
          titulo: t.titulo || t.title || 'AI Task',
          descripcion: t.descripcion || t.description || '',
          prioridad: t.prioridad || 'MEDIUM',
          estimacionHoras: t.estimacionHoras ? Number(t.estimacionHoras) : null,
          idUsuario: defaultUserId ? Number(defaultUserId) : null,
          idSprint: defaultSprintId ? Number(defaultSprintId) : null
        };
        try {
          if (onAddTask) {
            await onAddTask(payload);
            successCount++;
          }
        } catch (e) {
          console.error("Failed adding task from AI", e);
        }
     }
     alert(`¡${successCount} tareas importadas con éxito al tablero!`);
     if (onBack) onBack();
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box display="flex" alignItems="center" gap={2}>
        {onBack && (
          <IconButton onClick={onBack} sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
          Asistente IAM
        </Typography>
      </Box>

      {/* Input Section */}
      <Paper 
        elevation={0}
        sx={{ 
           p: 4, 
           borderRadius: 3, 
           background: 'linear-gradient(145deg, rgba(88, 28, 135, 0.15) 0%, rgba(31, 41, 55, 0.4) 100%)',
           border: '1px solid rgba(139, 92, 246, 0.2)'
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
           <SmartToyIcon sx={{ color: '#8B5CF6' }} />
           <Typography variant="h6" fontWeight="600" color="text.primary">
             Generador Inteligente de Workflows
           </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Describe el proyecto o feature que quieres construir, y la IA del backend lo desglosará automáticamente en tareas de desarrollo (sprints, historias y estimaciones) listas para trabajar.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField 
            fullWidth 
            variant="filled"
            placeholder="Ej: Quiero un módulo de autenticación con JWT y Spring Security..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            multiline
            minRows={2}
            InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            sx={{ 
                px: 4, minWidth: 200, 
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                '&:hover': { background: 'linear-gradient(90deg, #4F46E5, #7C3AED)' }
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
          >
            {loading ? 'Generando...' : 'Generar Plan'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      {/* Result Section */}
      {result && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'background.paper', mb: 8 }}>
           <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h5" fontWeight="700">Plan Sugerido</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.tasks ? result.tasks.length : 0} tareas generadas
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<AddTaskIcon />}
                onClick={handleAddAll}
                sx={{ px: 3, py: 1 }}
              >
                Importar todas las tareas ({result.tasks?.length})
              </Button>
           </Box>

           <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 3 }} />

           <Grid container spacing={3}>
              {(result.tasks || []).map((t, i) => (
                 <Grid item xs={12} sm={6} key={i}>
                    <Card 
                        elevation={0}
                        sx={{ 
                            height: '100%', 
                            borderRadius: 2, 
                            border: '1px solid rgba(255,255,255,0.03)',
                            background: 'rgba(255,255,255,0.01)',
                            '&:hover': { borderColor: 'rgba(99, 102, 241, 0.3)' }
                        }}
                    >
                       <CardContent>
                          <Box display="flex" justifyContent="space-between" mb={2}>
                            <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                {t.titulo || t.title}
                            </Typography>
                            {t.estimacionHoras && (
                                <Chip label={`${t.estimacionHoras}h`} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 'bold' }} />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                             {t.descripcion || t.description}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={3}>
                             <Chip label={`Prio: ${t.prioridad || 'MID'}`} size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'rgba(255,255,255,0.1)' }}/>
                          </Stack>
                       </CardContent>
                    </Card>
                 </Grid>
              ))}
           </Grid>
        </Paper>
      )}
    </Box>
  );
}
