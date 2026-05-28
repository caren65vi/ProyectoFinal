import * as React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { createTheme } from '@mui/material/styles';
import { CircularProgress } from '@mui/material';
import { signIn as firebaseSignIn, signInGoogle,  onAuthChange, doSignOut } from '../../FireBase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../FireBase/config';
import './Login.css';

const providers = [
  { id: 'google', name: 'Google' },
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

  const THEME = createTheme({
    palette: { mode: 'dark' },
  });

  const localeText = {
    signInTitle: 'Inicio sesión',
    signInSubtitle: 'Accede con tu cuenta',
    signInRememberMe: 'Recordarme',
    providerSignInTitle: (provider) =>
      provider.toLowerCase().includes('google')
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
      } else {
        setSessionData(null);
      }
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (provider, formData) => {
    try {
      let result;
      if (provider.id === 'credentials') {
        const email = formData.get('email');
        const password = formData.get('password');
        result = await firebaseSignIn(email, password);
      } else if (provider.id === 'google') {
        result = await signInGoogle();
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
    // Aquí va tu dashboard según el rol
    return (
      <div className="login-session">
        <p>Bienvenido: {sessionData.userData?.nombre || sessionData.userData?.email}</p>
        <p>Rol: {sessionData.userData?.rol}</p>
        <button onClick={doSignOut}>Cerrar sesión</button>
      </div>
    );
  }

  return (
    <AppProvider theme={THEME}>
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
