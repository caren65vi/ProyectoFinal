import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { register } from '../../FireBase/auth';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  const [cargando, setCargando] = React.useState(false);
  const [error, setError]       = React.useState('');
  const [form, setForm]         = React.useState({
    nombre: '', email: '', password: '', confirmar: '',
  });

  const handleChange = (e) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim())  return setError('El nombre es obligatorio.');
    if (!form.email.trim())   return setError('El correo es obligatorio.');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden.');

    setCargando(true);
    try {
      await register(form.email.trim(), form.password, form.nombre.trim());
      navigate('/dashboard');
    } catch (err) {
      const mensajes = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
        'auth/invalid-email':        'El correo no es válido.',
        'auth/weak-password':        'La contraseña es muy débil.',
      };
      setError(mensajes[err.code] || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={`registerWrapper${prefersDark ? ' dark' : ''}`}>
      <div className="registerBrand">
        <div className="registerBrandBar" />
        <h1>ResuelveUA</h1>
        <p>Crea tu cuenta para reportar incidentes en el campus.</p>
        <small>Universidad de la Amazonia</small>
      </div>

      <div className="registerCard">
        <h2 className="registerTitle">Crear cuenta</h2>
        <p className="registerSub">Completa los datos para registrarte</p>

        <form className="registerForm" onSubmit={handleSubmit} noValidate>
          <div className="registerField">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre" name="nombre" type="text"
              placeholder="Tu nombre completo"
              value={form.nombre} onChange={handleChange}
              autoComplete="name" required
            />
          </div>

          <div className="registerField">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email" name="email" type="email"
              placeholder="correo@uniamazonia.edu.co"
              value={form.email} onChange={handleChange}
              autoComplete="email" required
            />
          </div>

          <div className="registerField">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password" name="password" type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={handleChange}
              autoComplete="new-password" required
            />
          </div>

          <div className="registerField">
            <label htmlFor="confirmar">Confirmar contraseña</label>
            <input
              id="confirmar" name="confirmar" type="password"
              placeholder="Repite tu contraseña"
              value={form.confirmar} onChange={handleChange}
              autoComplete="new-password" required
            />
          </div>

          {error && <p className="registerError">{error}</p>}

          <button type="submit" className="registerBtn" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="registerFooter">
          ¿Ya tienes una cuenta?{' '}
          <a href="/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}
