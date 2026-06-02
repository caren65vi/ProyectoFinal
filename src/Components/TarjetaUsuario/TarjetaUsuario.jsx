import { createPortal } from 'react-dom'
import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import CloseIcon from '@mui/icons-material/Close'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined'
import { db } from '../../FireBase/config'

const fmt = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  } catch { return iso }
}

const PERMISOS_ROL = {
  admin:   ['leer', 'escribir', 'eliminar', 'gestionar_usuarios'],
  usuario: ['leer', 'reportar_incidentes'],
}

const TarjetaUsuario = ({ usuario, onClose, onUpdate, currentAdminUid }) => {
  const [rol, setRol]           = useState(usuario.rol ?? 'usuario')
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [confirm, setConfirm]   = useState(null)

  const esMismoAdmin = currentAdminUid && currentAdminUid === usuario.uid

  const solicitarCambio = (newRol) => {
    if (newRol === rol || saving || esMismoAdmin) return
    setConfirm(newRol)
  }

  const confirmarCambio = async () => {
    if (!confirm || saving) return
    setSaving(true)
    setFeedback(null)
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        rol: confirm,
        permisos: PERMISOS_ROL[confirm],
      })
      setRol(confirm)
      setFeedback({ ok: true, msg: `Rol actualizado a "${confirm === 'admin' ? 'Administrador' : 'Usuario'}" correctamente.` })
      onUpdate?.({ ...usuario, rol: confirm, permisos: PERMISOS_ROL[confirm] })
      setTimeout(() => setFeedback(null), 3500)
    } catch {
      setFeedback({ ok: false, msg: 'Error al actualizar el rol. Intenta de nuevo.' })
    } finally {
      setSaving(false)
      setConfirm(null)
    }
  }

  const cancelarCambio = () => setConfirm(null)

  const permisos = PERMISOS_ROL[rol] ?? usuario.permisos ?? []

  const modal = (
    <div className="taus__backdrop" onClick={onClose}>
      <div className="taus__modal" onClick={e => e.stopPropagation()}>

        {/* ── Cabecera ── */}
        <header className="taus__header">
          <div className="taus__avatar-wrap">
            {usuario.photoURL
              ? <img src={usuario.photoURL} alt="avatar" className="taus__avatar-img" />
              : <AccountCircleIcon className="taus__avatar-icon" />
            }
            <div>
              <h2 className="taus__nombre">{usuario.nombre || '(Sin nombre)'}</h2>
              <span className={`taus__rol-badge taus__rol-badge--${rol}`}>
                {rol === 'admin' ? <ShieldOutlinedIcon fontSize="small" /> : <PersonOutlinedIcon fontSize="small" />}
                {rol === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>
          <button className="taus__close-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon fontSize="small" />
          </button>
        </header>

        {/* ── Cuerpo ── */}
        <div className="taus__body">

          {/* Columna izquierda — info */}
          <div className="taus__left">
            <div className="taus__info-section">
              <span className="taus__label">INFORMACIÓN DE CUENTA</span>
              <div className="taus__info-list">
                <div className="taus__info-row">
                  <EmailOutlinedIcon className="taus__info-icon" />
                  <div>
                    <span className="taus__info-key">Correo electrónico</span>
                    <p className="taus__info-val">{usuario.email || '—'}</p>
                  </div>
                </div>
                <div className="taus__info-row">
                  <PersonOutlinedIcon className="taus__info-icon" />
                  <div>
                    <span className="taus__info-key">UID</span>
                    <p className="taus__info-val taus__uid">{usuario.uid}</p>
                  </div>
                </div>
                <div className="taus__info-row">
                  <CalendarTodayOutlinedIcon className="taus__info-icon" />
                  <div>
                    <span className="taus__info-key">Miembro desde</span>
                    <p className="taus__info-val">{fmt(usuario.creadoEn)}</p>
                  </div>
                </div>
                {usuario.descripcion && (
                  <div className="taus__info-row">
                    <PersonOutlinedIcon className="taus__info-icon" />
                    <div>
                      <span className="taus__info-key">Descripción</span>
                      <p className="taus__info-val">{usuario.descripcion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="taus__permisos-section">
              <span className="taus__label">PERMISOS ACTUALES</span>
              <ul className="taus__permisos-list">
                {permisos.map(p => (
                  <li key={p} className="taus__permiso">
                    <LockPersonOutlinedIcon fontSize="small" />
                    {p.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Columna derecha — gestión de rol */}
          <div className="taus__right">
            <span className="taus__label">CAMBIAR ROL</span>

            {esMismoAdmin && (
              <div className="taus__warning">
                <WarningAmberIcon fontSize="small" />
                <p>No puedes cambiar tu propio rol de administrador.</p>
              </div>
            )}

            {!esMismoAdmin && (
              <p className="taus__hint">
                Selecciona el rol que deseas asignar a este usuario.
                El cambio aplica de inmediato.
              </p>
            )}

            <div className="taus__rol-btns">
              <button
                className={`taus__rol-btn taus__rol-btn--usuario${rol === 'usuario' ? ' taus__rol-btn--active' : ''}`}
                onClick={() => solicitarCambio('usuario')}
                disabled={saving || esMismoAdmin}
              >
                <PersonOutlinedIcon />
                <div>
                  <strong>Usuario</strong>
                  <span>Puede reportar incidentes</span>
                </div>
                {rol === 'usuario' && <CheckCircleIcon className="taus__check" />}
              </button>

              <button
                className={`taus__rol-btn taus__rol-btn--admin${rol === 'admin' ? ' taus__rol-btn--active' : ''}`}
                onClick={() => solicitarCambio('admin')}
                disabled={saving || esMismoAdmin}
              >
                <ShieldOutlinedIcon />
                <div>
                  <strong>Administrador</strong>
                  <span>Acceso completo al sistema</span>
                </div>
                {rol === 'admin' && <CheckCircleIcon className="taus__check" />}
              </button>
            </div>

            {/* Confirmación */}
            {confirm && (
              <div className="taus__confirm">
                <WarningAmberIcon className="taus__confirm-icon" />
                <p>
                  ¿Confirmar cambio de rol a{' '}
                  <strong>{confirm === 'admin' ? 'Administrador' : 'Usuario'}</strong>?
                </p>
                <div className="taus__confirm-btns">
                  <button
                    className="taus__confirm-btn taus__confirm-btn--yes"
                    onClick={confirmarCambio}
                    disabled={saving}
                  >
                    {saving ? 'Guardando…' : 'Confirmar'}
                  </button>
                  <button
                    className="taus__confirm-btn taus__confirm-btn--no"
                    onClick={cancelarCambio}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {feedback && (
              <p className={`taus__feedback${feedback.ok ? ' taus__feedback--ok' : ' taus__feedback--err'}`}>
                {feedback.msg}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default TarjetaUsuario
