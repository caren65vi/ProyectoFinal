import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'
import { useNavigate } from 'react-router-dom'
import './MisIncidentes.css'

const TIPO_LABEL = {
  electrico:       'Eléctrico',
  infraestructura: 'Infraestructura',
  plomeria:        'Plomería',
  seguridad:       'Seguridad',
  otro:            'Otro',
}

const STATE_ALIAS = {
  abierto: 'reportado',
  en_proceso: 'analisis',
  cerrado: 'resuelto',
}

const normalizeState = (state) => STATE_ALIAS[state] || state

const ESTADO_LABEL = {
  reportado: 'Reportado',
  analisis: 'En análisis',
  resuelto: 'Resuelto',
}

const ESTADO_CLASS = {
  reportado: 'misIncidenteEstadoAbierto',
  analisis: 'misIncidenteEstadoProceso',
  resuelto: 'misIncidenteEstadoCerrado',
}

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

const MisIncidentes = () => {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    const q = query(
      collection(db, 'incidente'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribeIncidents = onSnapshot(
      q,
      (snap) => {
        setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('[MisIncidentes]', err)
        setError('No se pudieron cargar los incidentes.')
        setLoading(false)
      },
    )

    return () => {
      if (unsubscribeIncidents) unsubscribeIncidents()
    }
  }, [])

  return (
    <div className="misIncidentes">
      <header className="misIncidentesHeader">
        <div>
          <h1 className="misIncidentesTitle">Incidentes</h1>
          <p className="misIncidentesSubtitle">Historial de reportes registrados</p>
        </div>
        <button className="misIncidentesBtn" onClick={() => navigate('/dashboard/reportar')}>
          <AddCircleOutlineIcon fontSize="small" />
          Nuevo reporte
        </button>
      </header>

      {error && <p className="misIncidentesError" role="alert">{error}</p>}

      {loading && (
        <ul className="misIncidentesList">
          {[1, 2, 3].map(i => (
            <li key={i} className="misIncidenteCard misIncidenteCardSkeleton" />
          ))}
        </ul>
      )}

      {!loading && !error && incidents.length === 0 && (
        <div className="misIncidentesEmpty">
          <AddCircleOutlineIcon sx={{ fontSize: 48 }} />
          <p>Aún no has reportado ningún incidente.</p>
          <button className="misIncidentesBtn" onClick={() => navigate('/dashboard/reportar')}>
            Reportar ahora
          </button>
        </div>
      )}

      {!loading && incidents.length > 0 && (
        <ul className="misIncidentesList">
          {incidents.map((inc) => (
            <li key={inc.id} className="misIncidenteCard">
              <div className="misIncidentePhoto">
                {inc.foto
                  ? <img src={inc.foto} alt={`Incidente ${TIPO_LABEL[inc.tipo] ?? inc.tipo}`} />
                  : <ImageNotSupportedOutlinedIcon className="misIncidenteNoPhoto" />
                }
              </div>

              <div className="misIncidenteBody">
                <div className="misIncidenteTop">
                  <div className="misIncidenteBadges">
                    <span className="misIncidenteTipo">{TIPO_LABEL[inc.tipo] ?? inc.tipo}</span>
                    <span className={`misIncidenteEstado ${ESTADO_CLASS[normalizeState(inc.estado)] ?? ''}`}>
                      {ESTADO_LABEL[normalizeState(inc.estado)] ?? inc.estado}
                    </span>
                  </div>
                  <span className="misIncidenteFecha">{formatDate(inc.createdAt)}</span>
                </div>

                <p className="misIncidenteDesc">{inc.descripcion ?? 'Sin descripción.'}</p>

                {inc.ubicacionTextual && (
                  <span className="misIncidenteUbicacion">📍 {inc.ubicacionTextual}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MisIncidentes
