import { useEffect, useState } from 'react'
import { onAuthChange } from '../../FireBase/auth'
import { db } from '../../FireBase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import BadgeIcon from '@mui/icons-material/Badge'
import SecurityIcon from '@mui/icons-material/Security'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import ActPassword from '../ActPassword/ActPassword'
import './DatosPersonales.css'

const DatosPersonales = () => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) { setLoading(false); return }
      try {
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setUserData(data)
          setFormData({ nombre: data.nombre ?? '', descripcion: data.descripcion ?? '' })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const handleSave = async () => {
    if (!user || !formData.nombre.trim()) return
    setSaving(true)
    setSaveMsg(null)
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
      })
      setUserData(prev => ({ ...prev, nombre: formData.nombre.trim(), descripcion: formData.descripcion.trim() }))
      setEditMode(false)
      setSaveMsg({ type: 'success', text: 'Datos actualizados correctamente.' })
    } catch {
      setSaveMsg({ type: 'error', text: 'Error al guardar. Intenta de nuevo.' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 4000)
    }
  }

  const handleCancel = () => {
    setFormData({ nombre: userData?.nombre ?? '', descripcion: userData?.descripcion ?? '' })
    setEditMode(false)
    setSaveMsg(null)
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) return <div className="dpLoading">Cargando perfil…</div>
  if (!user) return <div className="dpLoading">No autenticado.</div>

  return (
    <div className="datosPersonales">
      {/* Encabezado */}
      <div className="dpHeader">
        <div className="dpHeaderLeft">
          {user.photoURL
            ? <img src={user.photoURL} alt="avatar" className="dpAvatarImg" />
            : (
              <div className="dpAvatarFallback">
                <PersonIcon style={{ fontSize: 38 }} />
              </div>
            )
          }
          <div className="dpHeaderInfo">
            <h1 className="dpTitle">Datos Personales</h1>
            <p className="dpSubtitle">Administra tu información de perfil</p>
          </div>
        </div>
        {!editMode && (
          <button className="dpEditBtn" onClick={() => setEditMode(true)}>
            <EditIcon style={{ fontSize: 16 }} />
            Editar perfil
          </button>
        )}
      </div>

      {saveMsg && (
        <div className={`dpAlert dpAlert--${saveMsg.type}`}>{saveMsg.text}</div>
      )}

      {/* Sección editable */}
      <div className="dpCard">
        <h2 className="dpCardTitle">Información Personal</h2>
        <div className="dpGrid">
          <div className="dpField">
            <label className="dpLabel">Nombre completo</label>
            {editMode
              ? (
                <input
                  className="dpInput"
                  value={formData.nombre}
                  onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Tu nombre completo"
                />
              )
              : <span className="dpValue">{userData?.nombre || '—'}</span>
            }
          </div>

          <div className="dpField">
            <label className="dpLabel">Descripción</label>
            {editMode
              ? (
                <textarea
                  className="dpTextarea"
                  value={formData.descripcion}
                  onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Escribe una breve descripción sobre ti"
                  rows={3}
                />
              )
              : <span className="dpValue">{userData?.descripcion || '—'}</span>
            }
          </div>
        </div>

        {editMode && (
          <div className="dpActions">
            <button className="dpBtnCancel" onClick={handleCancel} disabled={saving}>
              <CloseIcon style={{ fontSize: 15 }} />
              Cancelar
            </button>
            <button
              className="dpBtnSave"
              onClick={handleSave}
              disabled={saving || !formData.nombre.trim()}
            >
              <SaveIcon style={{ fontSize: 15 }} />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Sección solo lectura */}
      <div className="dpCard">
        <h2 className="dpCardTitle">Información de Cuenta</h2>
        <div className="dpGrid">
          <div className="dpField">
            <label className="dpLabel">
              <EmailIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} />
              Correo electrónico
            </label>
            <span className="dpValue dpValueMono">{userData?.email || '—'}</span>
            <span className="dpHint">El correo no puede modificarse.</span>
          </div>

          <div className="dpField">
            <label className="dpLabel">
              <BadgeIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} />
              Rol
            </label>
            <span className={`dpRolBadge dpRol--${userData?.rol}`}>
              {userData?.rol || '—'}
            </span>
          </div>

          <div className="dpField">
            <label className="dpLabel">
              <CalendarTodayIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} />
              Miembro desde
            </label>
            <span className="dpValue">{formatDate(userData?.creadoEn)}</span>
          </div>

          <div className="dpField dpFieldFull">
            <label className="dpLabel">
              <SecurityIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} />
              Permisos
            </label>
            <div className="dpPermisos">
              {(userData?.permisos ?? []).map(p => (
                <span key={p} className="dpPermiso">{p.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>

          <div className="dpField dpFieldFull">
            <label className="dpLabel">ID de cuenta</label>
            <span className="dpValue dpValueMono dpValueId">{userData?.uid || '—'}</span>
          </div>
        </div>
      </div>

      {/* Cambio de contraseña — siempre al final */}
      <ActPassword firebaseUser={user} />
    </div>
  )
}

export default DatosPersonales
