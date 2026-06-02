import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { auth, db } from '../../FireBase/config'
import { onAuthChange } from '../../FireBase/auth'
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

const ESTADO_LABEL = {
  abierto:    'Abierto',
  en_proceso: 'En proceso',
  cerrado:    'Cerrado',
}

const ESTADO_CLASS = {
  abierto:    'misIncidenteEstadoAbierto',
  en_proceso: 'misIncidenteEstadoProceso',
  cerrado:    'misIncidenteEstadoCerrado',
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
    let unsubscribeIncidents = null
    const unsubscribeAuth = onAuthChange((firebaseUser) => {
      if (!firebaseUser) {
        setIncidents([])
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      const q = query(
        collection(db, 'incidente'),
        where('idUsuario', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc'),
      )

      if (unsubscribeIncidents) unsubscribeIncidents()
      unsubscribeIncidents = onSnapshot(
        q,
        (snap) => {
          setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
          setLoading(false)
          setError('')
        },
        (err) => {
          console.error('[MisIncidentes]', err)
          setError('No se pudieron cargar tus incidentes.')
          setLoading(false)
        },
      )
    })

    return () => {
      if (unsubscribeIncidents) unsubscribeIncidents()
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth()
    }
  }, [])

  return (
    <div className="misIncidentes">
      <header className="misIncidentesHeader">
        <div>
          <h1 className="misIncidentesTitle">Mis incidentes</h1>
          <p className="misIncidentesSubtitle">Historial de reportes que has enviado</p>
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
                    <span className={`misIncidenteEstado ${ESTADO_CLASS[inc.estado] ?? ''}`}>
                      {ESTADO_LABEL[inc.estado] ?? inc.estado}
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
