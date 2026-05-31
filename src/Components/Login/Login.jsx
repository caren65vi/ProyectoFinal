import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { createTheme } from '@mui/material/styles';
import { CircularProgress, useMediaQuery } from '@mui/material';
import { signIn as firebaseSignIn, signInGoogle, signInMicrosoft, onAuthChange, doSignOut } from '../../FireBase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../FireBase/config';
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

const Login = () => {
  const [sessionData, setSessionData] = React.useState(null);
  const [cargando, setCargando] = React.useState(true);
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
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
        const userData = snap.exists()
          ? snap.data()
          : { rol: 'usuario', email: firebaseUser.email, nombre: firebaseUser.displayName };
        setSessionData({ user: firebaseUser, userData });
        if (userData.rol !== 'admin') {
          navigate('/dashboard');
        }
      } else {
        setSessionData(null);
      }
      setCargando(false);
    });
    return unsubscribe;
  }, [navigate]);

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

  if (cargando) {
    return (
      <div className="login-loading">
        <CircularProgress />
      </div>
    );
  }

  if (sessionData) {
    if (sessionData.userData?.rol === 'admin') {
      return (
        <div className="login-session">
          <p>Bienvenido administrador: {sessionData.userData?.nombre || sessionData.userData?.email}</p>
          <p>Este dashboard es solo para usuarios normales.</p>
          <button onClick={doSignOut}>Cerrar sesión</button>
        </div>
      );
    }

    return (
      <div className="login-loading">
        <p>Redirigiendo al dashboard...</p>
      </div>
    );
  }

  return (
    <AppProvider theme={appTheme}>
      <div className="login-wrapper">
        <SignInPage
          signIn={signIn}
          providers={providers}
          localeText={localeText}
          slotProps={{
            form: { noValidate: true },
            submitButton: { color: 'primary', variant: 'contained' },
          }}
        />
      </div>
    </AppProvider>
  );
};

export default Login;
