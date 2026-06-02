import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../FireBase/config'

const typeLabels = {
  electrico: 'Electrico',
  infraestructura: 'Infraestructura',
  plomeria: 'Plomeria',
  seguridad: 'Seguridad',
  otro: 'Otro',
}

const stateLabels = {
  abierto:    'Abierto',
  en_proceso: 'En proceso',
  cerrado:    'Cerrado',
}

const placeholders = Array.from({ length: 3 }, (_, index) => ({
  id: `placeholder-${index}`,
  placeholder: true,
}))

const LatestIncidents = () => {
  const [incidents, setIncidents] = useState([])
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const latestIncidentsQuery = query(
      collection(db, 'incidente'),
      orderBy('createdAt', 'desc'),
      limit(3),
    )

    return onSnapshot(
      latestIncidentsQuery,
      (snapshot) => {
        setIncidents(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })))
        setRevision((current) => current + 1)
        setError('')
      },
      (listenerError) => {
        console.error('[LatestIncidents] Firestore listener error:', listenerError)
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
        {visibleCards.map((incident, index) => (
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
              <img src={incident.foto} alt={`Incidencia de ${typeLabels[incident.tipo] || incident.tipo}`} />
              <div className="latestIncidentContent">
                <div className="latestIncidentMeta">
                  <strong>{typeLabels[incident.tipo] || incident.tipo || 'Sin tipo'}</strong>
                  <span className={`latestIncidentState latestIncidentState--${incident.estado}`}>
                    {stateLabels[incident.estado] || incident.estado || 'Sin estado'}
                  </span>
                </div>
                <p>{incident.descripcion || 'Sin descripcion disponible.'}</p>
              </div>
            </article>
          )
        ))}
      </div>
    </section>
  )
}

export default LatestIncidents
