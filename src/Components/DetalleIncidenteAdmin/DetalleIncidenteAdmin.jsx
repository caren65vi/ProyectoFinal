import { createPortal } from 'react-dom'
import { useState } from 'react'
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import CloseIcon from '@mui/icons-material/Close'
import BoltIcon from '@mui/icons-material/Bolt'
import OpacityIcon from '@mui/icons-material/Opacity'
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'
import SecurityIcon from '@mui/icons-material/Security'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import { db } from '../../FireBase/config'
import './DetalleIncidenteAdmin.css'

const TIPO_META = {
  electrico:       { label: 'Eléctrico',      icon: <BoltIcon />,              cls: 'dadi__tipo--electrico' },
  infraestructura: { label: 'Infraestructura', icon: <HomeRepairServiceIcon />, cls: 'dadi__tipo--infraestructura' },
  plomeria:        { label: 'Plomería',        icon: <OpacityIcon />,           cls: 'dadi__tipo--plomeria' },
  seguridad:       { label: 'Seguridad',       icon: <SecurityIcon />,          cls: 'dadi__tipo--seguridad' },
  otro:            { label: 'Otro',            icon: <HelpOutlineIcon />,       cls: 'dadi__tipo--otro' },
}

const STATE_ALIAS = { abierto: 'reportado', en_proceso: 'analisis', cerrado: 'resuelto' }
const normalizeState = (s) => STATE_ALIAS[s] || s || 'reportado'

const ESTADO_META = {
  reportado: { label: 'Reportado',   cls: 'dadi__badge--reportado' },
  analisis:  { label: 'En análisis', cls: 'dadi__badge--analisis' },
  resuelto:  { label: 'Resuelto',    cls: 'dadi__badge--resuelto' },
}

const ESTADO_ORDER = ['reportado', 'analisis', 'resuelto']

const ESTADO_BTN_META = {
  reportado: { label: 'Reportado',   cls: 'dadi__est-btn--reportado' },
  analisis:  { label: 'En análisis', cls: 'dadi__est-btn--analisis' },
  resuelto:  { label: 'Resuelto',    cls: 'dadi__est-btn--resuelto' },
}

const fmt = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

const DetalleIncidenteAdmin = ({ incident, onClose, onUpdate }) => {
  const [estado, setEstado] = useState(normalizeState(incident.estado))
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [propagarGrupo, setPropararGrupo] = useState(true)

  const tipo      = TIPO_META[incident.tipo] ?? { label: incident.tipo, icon: <HelpOutlineIcon />, cls: 'dadi__tipo--otro' }
  const estadoMeta = ESTADO_META[estado] ?? { label: estado, cls: 'dadi__badge--reportado' }

  const cambiarEstado = async (newEstado) => {
    if (newEstado === estado || saving) return
    setSaving(true)
    setFeedback(null)
    try {
      const ahora = new Date().toISOString()

      if (incident.grupoId && propagarGrupo) {
        const q = query(collection(db, 'incidente'), where('grupoId', '==', incident.grupoId))
        const snap = await getDocs(q)
        const batch = writeBatch(db)
        snap.docs.forEach(d => batch.update(d.ref, { estado: newEstado, updatedAt: ahora }))
        await batch.commit()
        setFeedback({ ok: true, msg: `Estado actualizado para todos los incidentes del grupo.` })
      } else {
        await updateDoc(doc(db, 'incidente', incident.id), { estado: newEstado, updatedAt: ahora })
        setFeedback({ ok: true, msg: 'Estado actualizado correctamente.' })
      }

      setEstado(newEstado)
      onUpdate?.({ ...incident, estado: newEstado, updatedAt: ahora })
      setTimeout(() => setFeedback(null), 3000)
    } catch {
      setFeedback({ ok: false, msg: 'Error al guardar. Intenta de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  const currentIdx = ESTADO_ORDER.indexOf(estado)

  const modal = (
    <div className="dadi__backdrop" onClick={onClose}>
      <div className="dadi__modal" onClick={e => e.stopPropagation()}>

        {/* ── Cabecera ── */}
        <header className="dadi__header">
          <div className="dadi__header-left">
            <span className={`dadi__tipo-icon ${tipo.cls}`}>{tipo.icon}</span>
            <div>
              <h2 className="dadi__title">{tipo.label} — {incident.ubicacionTextual || 'Sin ubicación'}</h2>
              <span className="dadi__id">ID: {incident.id?.slice(0, 16).toUpperCase()}</span>
            </div>
          </div>
          <div className="dadi__header-right">
            <span className={`dadi__badge ${estadoMeta.cls}`}>{estadoMeta.label}</span>
            <button className="dadi__close-btn" onClick={onClose} aria-label="Cerrar">
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </header>

        {/* ── Cuerpo ── */}
        <div className="dadi__body">

          {/* Columna izquierda — datos */}
          <div className="dadi__left">
            <div className="dadi__photo">
              {incident.foto
                ? <img src={incident.foto} alt="Foto del incidente" />
                : (
                  <div className="dadi__no-photo">
                    <ImageNotSupportedOutlinedIcon />
                    <span>Sin foto adjunta</span>
                  </div>
                )
              }
            </div>

            {incident.descripcion && (
              <div className="dadi__section">
                <span className="dadi__label">DESCRIPCIÓN</span>
                <p className="dadi__desc">{incident.descripcion}</p>
              </div>
            )}

            <div className="dadi__info-grid">
              <div className="dadi__info-item">
                <span className="dadi__label">TIPO</span>
                <p>{tipo.label}</p>
              </div>
              <div className="dadi__info-item">
                <span className="dadi__label">FECHA DE REPORTE</span>
                <div className="dadi__info-row">
                  <CalendarTodayOutlinedIcon className="dadi__info-icon" />
                  <p>{fmt(incident.createdAt ?? incident.fecha)}</p>
                </div>
              </div>
              {incident.ubicacionTextual && (
                <div className="dadi__info-item">
                  <span className="dadi__label">UBICACIÓN</span>
                  <div className="dadi__info-row">
                    <LocationOnOutlinedIcon className="dadi__info-icon" />
                    <p>{incident.ubicacionTextual}</p>
                  </div>
                </div>
              )}
              {incident.latitud != null && (
                <div className="dadi__info-item">
                  <span className="dadi__label">COORDENADAS</span>
                  <p>{incident.latitud.toFixed(5)}° N, {incident.longitud?.toFixed(5)}° O</p>
                </div>
              )}
              <div className="dadi__info-item dadi__info-item--full">
                <span className="dadi__label">REPORTADO POR (UID)</span>
                <div className="dadi__info-row">
                  <PersonOutlinedIcon className="dadi__info-icon" />
                  <p className="dadi__uid">{incident.idUsuario || '—'}</p>
                </div>
              </div>
              {incident.grupoId && (
                <div className="dadi__info-item dadi__info-item--full">
                  <span className="dadi__label">GRUPO</span>
                  <div className="dadi__info-row">
                    <AccountTreeOutlinedIcon className="dadi__info-icon" />
                    <p className="dadi__uid">{incident.nombreGrupo || incident.grupoId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha — gestión */}
          <div className="dadi__right">

            {/* Cambiar estado */}
            <div className="dadi__estado-panel">
              <span className="dadi__label">CAMBIAR ESTADO</span>
              <p className="dadi__hint">Selecciona el nuevo estado del incidente.</p>

              {incident.grupoId && (
                <label className="dadi__grupo-toggle">
                  <input
                    type="checkbox"
                    checked={propagarGrupo}
                    onChange={e => setPropararGrupo(e.target.checked)}
                  />
                  <span>Aplicar a todos los incidentes del grupo</span>
                </label>
              )}

              <div className="dadi__est-btns">
                {ESTADO_ORDER.map(key => (
                  <button
                    key={key}
                    className={`dadi__est-btn ${ESTADO_BTN_META[key].cls}${estado === key ? ' dadi__est-btn--active' : ''}`}
                    onClick={() => cambiarEstado(key)}
                    disabled={saving}
                  >
                    {estado === key
                      ? <CheckCircleIcon fontSize="small" />
                      : <RadioButtonUncheckedIcon fontSize="small" />
                    }
                    {ESTADO_BTN_META[key].label}
                  </button>
                ))}
              </div>

              {saving && (
                <p className="dadi__feedback dadi__feedback--saving">
                  <HourglassEmptyIcon fontSize="small" /> Guardando…
                </p>
              )}
              {feedback && (
                <p className={`dadi__feedback${feedback.ok ? ' dadi__feedback--ok' : ' dadi__feedback--err'}`}>
                  {feedback.msg}
                </p>
              )}
            </div>

            {/* Línea de tiempo */}
            <div className="dadi__timeline">
              <span className="dadi__label">LÍNEA DE TIEMPO</span>
              <div className="dadi__steps">
                {ESTADO_ORDER.map((key, i) => {
                  const done    = i <= currentIdx
                  const current = i === currentIdx
                  const meta    = ESTADO_META[key]
                  return (
                    <div key={key} className="dadi__step">
                      <div className="dadi__step-track">
                        <div className={`dadi__step-circle${done ? ' dadi__step-circle--done' : ''}${current ? ' dadi__step-circle--current' : ''}`}>
                          {done
                            ? <CheckCircleIcon fontSize="small" />
                            : <RadioButtonUncheckedIcon fontSize="small" />
                          }
                        </div>
                        {i < ESTADO_ORDER.length - 1 && (
                          <div className={`dadi__step-line${done ? ' dadi__step-line--done' : ''}`} />
                        )}
                      </div>
                      <div className="dadi__step-content">
                        <strong className={current ? 'dadi__step-label--current' : ''}>{meta.label}</strong>
                        {key === 'reportado' && (
                          <span>{fmt(incident.createdAt ?? incident.fecha)}</span>
                        )}
                        {key === 'analisis' && estado === 'analisis' && (
                          <span>En progreso…</span>
                        )}
                        {key === 'resuelto' && estado === 'resuelto' && incident.updatedAt && (
                          <span>{fmt(incident.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default DetalleIncidenteAdmin
