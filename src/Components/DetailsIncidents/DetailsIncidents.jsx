import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import BoltIcon from '@mui/icons-material/Bolt'
import OpacityIcon from '@mui/icons-material/Opacity'
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'
import SecurityIcon from '@mui/icons-material/Security'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined'
import './DetailsIncidents.css'

const TIPO_META = {
  electrico:       { label: 'Eléctrico',      icon: <BoltIcon />,              cls: 'detTipoElectrico' },
  infraestructura: { label: 'Infraestructura', icon: <HomeRepairServiceIcon />, cls: 'detTipoInfraestructura' },
  plomeria:        { label: 'Plomería',        icon: <OpacityIcon />,           cls: 'detTipoPlomeria' },
  seguridad:       { label: 'Seguridad',       icon: <SecurityIcon />,          cls: 'detTipoSeguridad' },
  otro:            { label: 'Otro',            icon: <HelpOutlineIcon />,       cls: 'detTipoOtro' },
}

const STATE_ALIAS = {
  abierto: 'reportado',
  en_proceso: 'analisis',
  cerrado: 'resuelto',
}

const normalizeState = (state) => STATE_ALIAS[state] || state

const ESTADO_META = {
  reportado: { label: 'Reportado', cls: 'detEstadoAbierto' },
  analisis:  { label: 'En análisis', cls: 'detEstadoProceso' },
  resuelto:  { label: 'Resuelto', cls: 'detEstadoCerrado' },
}

const ORDER_IDX = { reportado: 0, analisis: 1, resuelto: 2 }

const STEPS = [
  { key: 'reportado', num: 1, label: 'Reportado',  desc: 'El incidente fue registrado exitosamente.' },
  { key: 'analisis',  num: 2, label: 'En análisis', desc: 'El equipo está atendiendo el incidente.' },
  { key: 'resuelto',  num: 3, label: 'Resuelto',    desc: 'El incidente fue solucionado.' },
  { key: 'notif',      num: 4, label: 'Notificación', desc: 'Te avisamos cuando sea resuelto.' },
]

const fmt = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

const StepIcon = ({ done, current }) => {
  if (done)    return <CheckCircleOutlinedIcon className="detStepIconDone" />
  if (current) return <PendingOutlinedIcon className="detStepIconCurrent" />
  return <RadioButtonUncheckedIcon className="detStepIconPending" />
}

const DetailsIncidents = ({ incident, onClose }) => {
  const tipo    = TIPO_META[incident.tipo]    ?? { label: incident.tipo,    icon: <HelpOutlineIcon />, cls: 'detTipoOtro' }
  const normalizedEstado = normalizeState(incident.estado)
  const estado  = ESTADO_META[normalizedEstado] ?? { label: normalizedEstado, cls: 'detEstadoAbierto' }
  const reached = ORDER_IDX[normalizedEstado]   ?? 0

  const modal = (
    <div className="detBackdrop" onClick={onClose}>
      <div className="detModal" onClick={e => e.stopPropagation()}>

        {/* ── Cabecera ── */}
        <header className="detHeader">
          <div className="detHeaderLeft">
            <span className={`detTipoIcon ${tipo.cls}`}>{tipo.icon}</span>
            <div>
              <h2 className="detTitle">{tipo.label} — {incident.ubicacionTextual || 'Sin ubicación'}</h2>
              <span className="detId">ID: {incident.id?.slice(0, 16).toUpperCase()}</span>
            </div>
          </div>
          <div className="detHeaderRight">
            <span className={`detEstadoBadge ${estado.cls}`}>{estado.label}</span>
            <button className="detCloseBtn" onClick={onClose} aria-label="Cerrar">
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </header>

        {/* ── Cuerpo ── */}
        <div className="detBody">

          {/* Columna izquierda */}
          <div className="detLeft">
            <div className="detPhoto">
              {incident.foto
                ? <img src={incident.foto} alt="Foto del incidente" />
                : (
                  <div className="detNoPhoto">
                    <ImageNotSupportedOutlinedIcon />
                    <span>Sin foto adjunta</span>
                  </div>
                )
              }
            </div>

            {incident.descripcion && (
              <div className="detSection">
                <span className="detLabel">DESCRIPCIÓN</span>
                <p className="detDesc">{incident.descripcion}</p>
              </div>
            )}

            <div className="detInfoGrid">
              <div className="detInfoItem">
                <span className="detLabel">TIPO</span>
                <p>{tipo.label}</p>
              </div>
              <div className="detInfoItem">
                <span className="detLabel">FECHA</span>
                <div className="detInfoRow">
                  <CalendarTodayOutlinedIcon className="detInfoIcon" />
                  <p>{fmt(incident.createdAt ?? incident.fecha)}</p>
                </div>
              </div>
              {incident.ubicacionTextual && (
                <div className="detInfoItem">
                  <span className="detLabel">UBICACIÓN</span>
                  <div className="detInfoRow">
                    <LocationOnOutlinedIcon className="detInfoIcon" />
                    <p>{incident.ubicacionTextual}</p>
                  </div>
                </div>
              )}
              {incident.latitud != null && (
                <div className="detInfoItem">
                  <span className="detLabel">COORDENADAS</span>
                  <p>{incident.latitud.toFixed(5)}° N, {incident.longitud.toFixed(5)}° O</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha — pasos */}
          <div className="detRight">
            <span className="detLabel">HISTORIAL DE ESTADO</span>
            <ul className="detSteps">
              {STEPS.map(({ key, num, label, desc }, i) => {
                const done    = key === 'notif' ? reached >= 2 : i <= reached
                const current = key !== 'notif' && i === reached
                return (
                  <li key={key} className={`detStep${done ? ' detStepDone' : ''}${current ? ' detStepCurrent' : ''}`}>
                    <div className="detStepLeft">
                      <div className="detStepNum">{num}</div>
                      {i < STEPS.length - 1 && <div className={`detStepLine${done ? ' detStepLineDone' : ''}`} />}
                    </div>
                    <div className="detStepContent">
                      <div className="detStepHeader">
                        <StepIcon done={done} current={current} />
                        <strong className="detStepTitle">{label}</strong>
                      </div>
                      <p className="detStepDesc">{desc}</p>
                      {current && (
                        <span className="detStepDate">{fmt(incident.createdAt ?? incident.fecha)}</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )

  return createPortal(modal, document.body)

}

export default DetailsIncidents
