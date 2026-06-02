import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { createTheme } from '@mui/material/styles';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Link, TextField, useMediaQuery } from '@mui/material';
import { signIn as firebaseSignIn, signInGoogle, signInMicrosoft, onAuthChange, fetchUserDataForAuth, resetPassword } from '../../FireBase/auth';
import './Login.css';

const providers = [
  { id: 'google', name: 'Google' },
  { id: 'microsoft-entra-id', name: 'Microsoft' },
  { id: 'credentials', name: 'Email and Password' },
];

const traducirError = (code) => {
  const errores = {
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/popup-closed-by-user': 'Se cerró la ventana antes de completar el acceso.',
    'auth/cancelled-popup-request': 'Operación cancelada.',
  };
  return errores[code] || 'Ocurrió un error. Intenta de nuevo.';
};

const ForgotPasswordLink = (props) => (
  <Link component="button" type="button" underline="hover" {...props}>
    Olvidaste tu contrasena?
  </Link>
);

const Login = () => {
  const [sessionData, setSessionData] = React.useState(null);
  const [cargando, setCargando] = React.useState(true);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetMessage, setResetMessage] = React.useState('');
  const [resetError, setResetError] = React.useState('');
  const [resetSending, setResetSending] = React.useState(false);
  const navigate = useNavigate();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const themeMode = prefersDarkMode ? 'dark' : 'light';

  const appTheme = React.useMemo(
    () => createTheme({
      palette: { mode: themeMode },
    }),
    [themeMode],
  );

  const localeText = {
    signInTitle: 'Inicio sesión',
    signInSubtitle: 'Accede con tu cuenta',
    signInRememberMe: 'Recordarme',
    providerSignInTitle: (provider) =>
      /google|microsoft/i.test(provider)
        ? `Iniciar sesión con ${provider}`
        : 'Iniciar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    or: 'o',
    with: 'con',
    passkey: 'passkey',
    to: 'a',
  };

  React.useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserDataForAuth(firebaseUser)
          ?? { rol: 'usuario', email: firebaseUser.email, nombre: firebaseUser.displayName };
        setSessionData({ user: firebaseUser, userData });
      } else {
        setSessionData(null);
      }
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!sessionData?.userData) return;
    const destination = sessionData.userData.rol === 'admin' ? '/admin' : '/dashboard';
    navigate(destination, { replace: true });
  }, [sessionData, navigate]);

  const signIn = async (provider, formData) => {
    try {
      let result;
      if (provider.id === 'credentials') {
        const email = formData.get('email');
        const password = formData.get('password');
        result = await firebaseSignIn(email, password);
      } else if (provider.id === 'google') {
        result = await signInGoogle();
      } else if (provider.id === 'microsoft-entra-id' || provider.id === 'microsoft') {
        result = await signInMicrosoft();
      } else {
        return { error: 'Proveedor no soportado.' };
      }
      setSessionData(result);
      return {};
    } catch (err) {
      return { error: traducirError(err.code) };
    }
  };

  const openResetPassword = () => {
    setResetMessage('');
    setResetError('');
    setResetOpen(true);
  };

  const closeResetPassword = () => {
    if (!resetSending) setResetOpen(false);
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetMessage('');
    setResetError('');

    const email = resetEmail.trim();
    if (!email) {
      setResetError('Ingresa tu correo electronico.');
      return;
    }

    setResetSending(true);
    try {
      await resetPassword(email);
      setResetMessage('Si existe una cuenta con ese correo, recibiras un enlace para cambiar tu contrasena.');
    } catch (err) {
      setResetError(traducirError(err.code));
    } finally {
      setResetSending(false);
    }
  };

  if (cargando) {
    return (
      <div className="login-loading">
        <CircularProgress />
      </div>
    );
  }

  if (sessionData) {
    return (
      <div className="login-loading">
        <p>Redirigiendo al dashboard...</p>
      </div>
    );
  }

  return (
    <AppProvider theme={appTheme}>
      <div className="login-wrapper">
        <div className="login-header-brand">
          <h1>ResuelveUA</h1>
          <p>Plataforma de Reportes de Incidentes</p>
          <small>Universidad de la Amazonia</small>
        </div>
        <div className="login-form-col">
          <SignInPage
            signIn={signIn}
            providers={providers}
            localeText={localeText}
            slots={{ forgotPasswordLink: ForgotPasswordLink }}
            slotProps={{
              form: { noValidate: true },
              forgotPasswordLink: { onClick: openResetPassword },
              submitButton: { color: 'primary', variant: 'contained' },
            }}
          />
          <p className="loginRegisterHint">
            ¿No tienes cuenta?{' '}
            <a href="/register">Regístrate aquí</a>
          </p>
          <Dialog open={resetOpen} onClose={closeResetPassword} fullWidth maxWidth="xs">
            <form onSubmit={handleResetPassword}>
              <DialogTitle>Recuperar contrasena</DialogTitle>
              <DialogContent>
                <p>Ingresa el correo de tu cuenta. Firebase enviara un enlace para crear una nueva contrasena.</p>
                <TextField
                  autoFocus
                  fullWidth
                  label="Correo electronico"
                  margin="normal"
                  onChange={(event) => setResetEmail(event.target.value)}
                  type="email"
                  value={resetEmail}
                />
                {resetMessage && <Alert severity="success">{resetMessage}</Alert>}
                {resetError && <Alert severity="error">{resetError}</Alert>}
              </DialogContent>
              <DialogActions>
                <Button onClick={closeResetPassword} disabled={resetSending}>Cancelar</Button>
                <Button type="submit" variant="contained" disabled={resetSending}>
                  {resetSending ? 'Enviando...' : 'Enviar enlace'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </div>
      </div>
    </AppProvider>
  );
};

export default Login;
