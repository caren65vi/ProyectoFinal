import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'

const typeLabels = {
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

const stateLabels = {
  reportado: 'Reportado',
  analisis: 'En análisis',
  resuelto: 'Resuelto',
}

const stateCls = {
  reportado: 'latestIncidentStateAbierto',
  analisis: 'latestIncidentStateProceso',
  resuelto: 'latestIncidentStateCerrado',
}

const placeholders = Array.from({ length: 3 }, (_, i) => ({ id: `ph-${i}`, placeholder: true }))

const toTimestamp = (value) => {
  if (!value) return 0
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const IncidentPhoto = ({ foto, tipo }) => {
  const [failedPhoto, setFailedPhoto] = useState('')

  if (!foto || failedPhoto === foto) {
    return (
      <div className="latestIncidentNoPhoto" aria-label="Incidente sin foto disponible">
        <ImageNotSupportedOutlinedIcon />
      </div>
    )
  }

  return (
    <img
      src={foto}
      alt={typeLabels[tipo] ?? tipo ?? 'Incidente'}
      onError={() => setFailedPhoto(foto)}
    />
  )
}

const LatestIncidents = () => {
  const [incidents, setIncidents] = useState([])
  const [revision,  setRevision]  = useState(0)
  const [error,     setError]     = useState('')

  useEffect(() => {
    return onSnapshot(
      collection(db, 'incidente'),
      (snapshot) => {
        const docs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => toTimestamp(b.createdAt ?? b.fecha) - toTimestamp(a.createdAt ?? a.fecha))
          .slice(0, 3)
        setIncidents(docs)
        setRevision(r => r + 1)
        setError('')
      },
      (err) => {
        console.error('[LatestIncidents]', err)
        setError('No fue posible cargar las incidencias recientes.')
      },
    )
  }, [])

  const visibleCards = [...incidents, ...placeholders].slice(0, 3)

  return (
    <section className="additionalInfo" aria-label="Ultimas incidencias reportadas">
      <header className="latestIncidentsHeading">
        <span>Actualizaciones en vivo</span>
        <h2>Ultimas incidencias</h2>
      </header>

      {error && <p className="latestIncidentsError" role="alert">{error}</p>}

      <div className="latestIncidentsList">
        {visibleCards.map((incident, index) =>
          incident.placeholder ? (
            <article className="latestIncidentCard latestIncidentPlaceholder" key={incident.id}>
              <span>Esperando nuevas incidencias...</span>
            </article>
          ) : (
            <article
              className="latestIncidentCard latestIncidentCardAnimated"
              key={`${incident.id}-${revision}`}
              style={{ '--incident-position': index }}
            >
              <IncidentPhoto foto={incident.foto} tipo={incident.tipo} />
              <div className="latestIncidentContent">
                <div className="latestIncidentMeta">
                  <strong>{typeLabels[incident.tipo] ?? incident.tipo ?? 'Sin tipo'}</strong>
                  <span className={`latestIncidentState ${stateCls[normalizeState(incident.estado)] ?? ''}`}>
                    {stateLabels[normalizeState(incident.estado)] ?? incident.estado ?? 'Sin estado'}
                  </span>
                </div>
                <p>{incident.descripcion ?? 'Sin descripción.'}</p>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  )
}

export default LatestIncidents
