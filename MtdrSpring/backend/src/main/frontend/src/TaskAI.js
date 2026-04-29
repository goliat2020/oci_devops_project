import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function TaskAI() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Task AI</Typography>
      <Paper className="task-card" variant="outlined" sx={{ p: 2 }}>
        <Typography color="textSecondary">Herramientas AI para tareas. Página en construcción.</Typography>
      </Paper>
    </Box>
  );
}