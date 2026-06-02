import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import './Datos.css'

const Datos = () => {
  const [counts, setCounts] = useState({ total: 0, abierto: 0, en_proceso: 0, cerrado: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'incidente'),
      (snapshot) => {
        const totals = { total: snapshot.size, abierto: 0, en_proceso: 0, cerrado: 0 }
        snapshot.docs.forEach((doc) => {
          const estado = doc.data().estado
          if (estado === 'abierto')    totals.abierto += 1
          if (estado === 'en_proceso') totals.en_proceso += 1
          if (estado === 'cerrado')    totals.cerrado += 1
        })
        setCounts(totals)
        setError('')
      },
      (err) => {
        console.error('[Datos] Firestore error:', err)
        setError('No fue posible cargar los datos.')
      },
    )
    return unsubscribe
  }, [])

  return (
    <section className="datosSummary" aria-label="Resumen de incidencias">
      <header className="datosSummaryHeader">
        <span>Estadísticas</span>
        <h2>Resumen de incidencias</h2>
      </header>

      {error && <p className="datosError" role="alert">{error}</p>}

      <div className="datosCards">
        <article className="datosCard datosCard--primary">
          <strong>{counts.total}</strong>
          <p>Total reportados</p>
        </article>
        <article className="datosCard datosCard--abierto">
          <strong>{counts.abierto}</strong>
          <p>Abiertos</p>
        </article>
        <article className="datosCard datosCard--proceso">
          <strong>{counts.en_proceso}</strong>
          <p>En proceso</p>
        </article>
        <article className="datosCard datosCard--cerrado">
          <strong>{counts.cerrado}</strong>
          <p>Resueltos</p>
        </article>
      </div>
    </section>
  )
}

export default Datos
