import { useEffect, useState } from 'react'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
import NotifitorPlity from '../../Components/NotifitorPlity/NotifitorPlity'
import {
  clearNotificationHistory,
  getNotificationHistory,
  notificationHistoryEvent,
} from '../../Components/IncidentNotifier/notificationHistory'
import './Notificaciones.css'

function getStateLabel(state) {
  const labels = {
    reportado: 'Reportado',
    analisis: 'En análisis',
    resuelto: 'Resuelto',
  }
  return labels[state] || state || 'Sin estado'
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const Notificaciones = () => {
  const [notifications, setNotifications] = useState(getNotificationHistory)

  useEffect(() => {
    const updateHistory = (event) => setNotifications(event.detail || getNotificationHistory())
    window.addEventListener(notificationHistoryEvent, updateHistory)
    return () => window.removeEventListener(notificationHistoryEvent, updateHistory)
  }, [])

  return (
    <div className="notificaciones">
      <NotifitorPlity />

      <section className="notificationHistory">
        <header className="notificationHistoryHeader">
          <div>
            <span className="notificationHistoryEyebrow">Actividad reciente</span>
            <h1>Historial de notificaciones</h1>
            <p>Nuevos reportes y cambios de estado registrados mientras la aplicacion esta abierta.</p>
          </div>
          {notifications.length > 0 && (
            <button type="button" onClick={clearNotificationHistory}>
              <DeleteOutlineIcon />
              Limpiar historial
            </button>
          )}
        </header>

        {notifications.length === 0 ? (
          <div className="notificationEmpty">
            <span className="notificationEmptyIcon"><AddCircleOutlineIcon /></span>
            <h2>Aun no hay notificaciones</h2>
            <p>Cuando se cree una incidencia o cambie su estado, aparecera aqui.</p>
          </div>
        ) : (
          <div className="notificationList">
            {notifications.map((notification) => (
              <article className="notificationCard" key={notification.id}>
                <span className={`notificationCardIcon notificationCardIcon--${notification.type}`}>
                  {notification.type === 'created' ? <AddCircleOutlineIcon /> : <SyncAltIcon />}
                </span>
                <div className="notificationCardContent">
                  <div className="notificationCardHeading">
                    <h2>{notification.title}</h2>
                    <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                  </div>
                  <p>{notification.body}</p>
                  <span className={`notificationState notificationState--${notification.state}`}>
                    {getStateLabel(notification.state)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Notificaciones
