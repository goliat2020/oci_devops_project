import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Link as MuiLink,
  Container
} from '@mui/material';

function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const res = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Error en el registro.');
          setLoading(false);
          return;
        }
        setIsRegister(false);
        setForm({ nombre: '', email: '', password: '' });
        setError('');
        setLoading(false);
        return;
      }

      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error en el login.');
        setLoading(false);
        return;
      }
      onLogin(data.user);
    } catch (err) {
      setError('Error de conexi\u00f3n. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7c3aed 0%, #d94c4c 100%)'
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesi\u00f3n'}
          </Typography>
          <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ mb: 3 }}>
            {isRegister
              ? 'Reg\u00edstrate para gestionar tus proyectos'
              : 'Ingresa a tu panel de tareas'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {isRegister && (
                <TextField
                  label="Nombre"
                  name="nombre"
                  fullWidth
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  size="small"
                />
              )}
              <TextField
                label="Correo electr\u00f3nico"
                name="email"
                type="email"
                fullWidth
                required
                value={form.email}
                onChange={handleChange}
                size="small"
              />
              <TextField
                label="Contrase\u00f1a"
                name="password"
                type="password"
                fullWidth
                required
                value={form.password}
                onChange={handleChange}
                size="small"
                inputProps={{ minLength: isRegister ? 8 : undefined }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  background: 'linear-gradient(90deg,#7c3aed,#d94c4c)',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  py: 1.2
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : (isRegister ? 'Registrarse' : 'Entrar')}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
            {isRegister ? '\u00bfYa tienes cuenta?' : '\u00bfNo tienes cuenta?'}{' '}
            <MuiLink
              component="button"
              type="button"
              variant="body2"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isRegister ? 'Inicia sesi\u00f3n' : 'Reg\u00edstrate'}
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default AuthPage;
