import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'

const typeLabels = {
  electrico:       'Eléctrico',
  infraestructura: 'Infraestructura',
  plomeria:        'Plomería',
  seguridad:       'Seguridad',
  otro:            'Otro',
}

const stateLabels = {
  abierto:    'Abierto',
  en_proceso: 'En proceso',
  cerrado:    'Cerrado',
  reportado:  'Reportado',
}

const stateCls = {
  abierto:    'latestIncidentStateAbierto',
  en_proceso: 'latestIncidentStateProceso',
  cerrado:    'latestIncidentStateCerrado',
  reportado:  'latestIncidentStateReportado',
}

const placeholders = Array.from({ length: 3 }, (_, i) => ({ id: `ph-${i}`, placeholder: true }))

const LatestIncidents = () => {
  const [incidents, setIncidents] = useState([])
  const [revision,  setRevision]  = useState(0)
  const [error,     setError]     = useState('')

  useEffect(() => {
    const latestIncidentsQuery = query(
      collection(db, 'incidente'),
      orderBy('createdAt', 'desc'),
      limit(3),
    )

    return onSnapshot(
      latestIncidentsQuery,
      (snapshot) => {
        setIncidents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
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
              {incident.foto
                ? (
                  <img
                    src={incident.foto}
                    alt={typeLabels[incident.tipo] ?? incident.tipo}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                )
                : (
                  <div className="latestIncidentNoPhoto">
                    <ImageNotSupportedOutlinedIcon />
                  </div>
                )
              }
              <div className="latestIncidentContent">
                <div className="latestIncidentMeta">
                  <strong>{typeLabels[incident.tipo] ?? incident.tipo ?? 'Sin tipo'}</strong>
                  <span className={`latestIncidentState ${stateCls[incident.estado] ?? ''}`}>
                    {stateLabels[incident.estado] ?? incident.estado ?? 'Sin estado'}
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
