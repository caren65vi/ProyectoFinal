import * as React from 'react';

import {
  Box,
  Button,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
  Paper,
} 
from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './Register.css';

const THEME = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#1d4ed8' },
    secondary: { main: '#60a5fa' },
    background: { default: '#0d1117', paper: '#1a2540' },
  },
  shape: { borderRadius: 10 },
});

export default function Register() {
  const handleRegister = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const userData = {
      name:            data.get('name'),
      email:           data.get('email'),
      password:        data.get('password'),
      confirmPassword: data.get('confirmPassword'),
    };
    console.log('Register data:', userData);
  };

  return (
    <ThemeProvider theme={THEME}>
      <Box className="register-wrapper">
        <Paper className="register-card" elevation={8} component="form" onSubmit={handleRegister} noValidate>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>
            Crear cuenta
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Regístrate para continuar
          </Typography>

          <Stack spacing={2}>
            <TextField required fullWidth id="name" name="name" label="Nombre completo" autoComplete="name" />
            <TextField required fullWidth id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" />
            <TextField required fullWidth id="password" name="password" label="Contraseña" type="password" autoComplete="new-password" />
            <TextField required fullWidth id="confirmPassword" name="confirmPassword" label="Confirmar contraseña" type="password" autoComplete="new-password" />

            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
              Registrarse
            </Button>
          </Stack>

          <Typography textAlign="center" variant="body2" mt={2}>
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" underline="hover" color="secondary">
              Inicia sesión
            </Link>
          </Typography>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
