import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import './Datos.css'

const statusBuckets = {
  reportado: ['reportado'],
  analisis: ['analisis'],
  resuelto: ['resuelto'],
}

const countState = (estado, bucket) => statusBuckets[bucket].includes(estado)

const Datos = () => {
  const [counts, setCounts] = useState({
    total: 0,
    reportado: 0,
    analisis: 0,
    resuelto: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'incidente'),
      (snapshot) => {
        const totals = {
          total: snapshot.size,
          reportado: 0,
          analisis: 0,
          resuelto: 0,
        }

        snapshot.docs.forEach((document) => {
          const estado = document.data().estado
          if (countState(estado, 'reportado')) totals.reportado += 1
          if (countState(estado, 'analisis')) totals.analisis += 1
          if (countState(estado, 'resuelto')) totals.resuelto += 1
        })

        setCounts(totals)
        setError('')
      },
      (listenerError) => {
        console.error('[Datos] Firestore listener error:', listenerError)
        setError('No fue posible cargar los datos de incidentes.')
      },
    )

    return unsubscribe
  }, [])

  return (
    <section className="datosSummary" aria-label="Resumen de datos de incidentes">
      <header className="datosSummaryHeader">
        <span>Datos</span>
        <h2>Resumen de incidencias</h2>
      </header>

      {error && <p className="datosError" role="alert">{error}</p>}

      <div className="datosCards">
        <article className="datosCard datosCard--primary">
          <strong>{counts.total}</strong>
          <p>Total de incidentes</p>
        </article>

        <article className="datosCard datosCard--reportado">
          <strong>{counts.reportado}</strong>
          <p>Reportado</p>
        </article>

        <article className="datosCard datosCard--analisis">
          <strong>{counts.analisis}</strong>
          <p>En análisis</p>
        </article>

        <article className="datosCard datosCard--resuelto">
          <strong>{counts.resuelto}</strong>
          <p>Resuelto</p>
        </article>
      </div>
    </section>
  )
}

export default Datos
