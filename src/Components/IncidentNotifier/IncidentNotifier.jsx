import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import {
  disableBrowserNotifications,
  enableBrowserNotifications,
  getBrowserNotificationPermission,
  getNotificationConsent,
  notificationPreferenceEvent,
} from './notificationPreferences'
import { addNotificationToHistory } from './notificationHistory'
import './IncidentNotifier.css'

function describeIncident(incident) {
  const type = incident.tipo || 'sin tipo'
  const location = incident.ubicacionTextual || 'ubicacion no especificada'
  return `${type}: ${location}`
}

function getStateLabel(state) {
  const labels = {
    reportado: 'Reportado',
    analisis: 'En análisis',
    resuelto: 'Resuelto',
  }
  return labels[state] || state || 'Sin estado'
}

const IncidentNotifier = () => {
  const [consent, setConsent] = useState(getNotificationConsent)
  const [alert, setAlert] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const updateConsent = (event) => setConsent(event.detail || getNotificationConsent())
    window.addEventListener(notificationPreferenceEvent, updateConsent)
    return () => window.removeEventListener(notificationPreferenceEvent, updateConsent)
  }, [])

  useEffect(() => {
    let initialized = false
    let alertTimer
    let incidentStates = new Map()

    const notify = (event) => {
      const savedEvent = addNotificationToHistory(event)
      if (consent === 'accepted' && getBrowserNotificationPermission() === 'granted') {
        try {
          const notification = new Notification(savedEvent.title, {
            body: savedEvent.body,
            icon: '/favicon.svg',
            tag: `${savedEvent.type}-${savedEvent.incidentId}`,
          })
          notification.onclick = () => window.focus()
        } catch (notificationError) {
          console.error('[IncidentNotifier] Browser notification error:', notificationError)
        }
      }
      setAlert(savedEvent)
      clearTimeout(alertTimer)
      alertTimer = window.setTimeout(() => setAlert(null), 6000)
    }

    const unsubscribe = onSnapshot(
      collection(db, 'incidente'),
      (snapshot) => {
        if (!initialized) {
          incidentStates = new Map(snapshot.docs.map((document) => [document.id, document.data().estado]))
          initialized = true
          return
        }

        snapshot.docChanges()
          .forEach((change) => {
            const incident = change.doc.data()
            const body = describeIncident(incident)
            if (change.type === 'added') {
              notify({
                type: 'created',
                incidentId: change.doc.id,
                title: 'Nueva incidencia reportada',
                body,
                state: incident.estado,
              })
            } else if (change.type === 'modified') {
              const previousState = incidentStates.get(change.doc.id)
              if (previousState !== incident.estado) {
                notify({
                  type: 'state_changed',
                  incidentId: change.doc.id,
                  title: 'Estado de incidencia actualizado',
                  body: `${body}. ${getStateLabel(previousState)} -> ${getStateLabel(incident.estado)}`,
                  state: incident.estado,
                })
              }
            }
          })

        incidentStates = new Map(snapshot.docs.map((document) => [document.id, document.data().estado]))
      },
      (listenerError) => {
        console.error('[IncidentNotifier] Firestore listener error:', listenerError)
        setError('No fue posible escuchar nuevas incidencias.')
      },
    )

    return () => {
      clearTimeout(alertTimer)
      unsubscribe()
    }
  }, [consent])

  const acceptNotifications = async () => {
    setError('')
    const permission = await enableBrowserNotifications()
    if (permission === 'denied') {
      setError('El navegador bloqueo las notificaciones. Puedes habilitarlas desde la configuracion del sitio.')
    } else if (permission === 'unsupported') {
      setError('Este navegador no soporta notificaciones.')
    }
  }

  const declineNotifications = () => {
    disableBrowserNotifications()
    setError('')
  }

  return (
    <>
      {consent === 'pending' && (
        <aside className="incidentConsent" aria-labelledby="incidentConsentTitle">
          <strong id="incidentConsentTitle">Notificaciones de nuevas incidencias</strong>
          <p>
            Si aceptas, ResuelveUA mostrara una alerta en este navegador cuando se registre una incidencia nueva
            mientras la aplicacion este abierta. Puedes desactivarlas despues desde Notificaciones.
          </p>
          <div className="incidentConsentActions">
            <button type="button" onClick={acceptNotifications}>Aceptar</button>
            <button type="button" className="incidentConsentSecondary" onClick={declineNotifications}>
              No aceptar
            </button>
          </div>
        </aside>
      )}

      {alert && (
        <div className="incidentToast" role="status">
          <strong>{alert.title}</strong>
          <span>{alert.body}</span>
        </div>
      )}

      {error && <p className="incidentNotifierError" role="alert">{error}</p>}
    </>
  )
}

export default IncidentNotifier
