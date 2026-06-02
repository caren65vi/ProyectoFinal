import { Link } from 'react-router-dom'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import './QuickAction.css'

const accesosRapidos = [
  {
    to: '/dashboard/reportar',
    title: 'Reportar incidente',
    description: 'Registra una novedad dentro del campus.',
    icon: <AddCircleOutlineIcon />,
  },
  {
    to: '/dashboard/mis-incidentes',
    title: 'Mis incidentes',
    description: 'Consulta el estado de tus reportes enviados.',
    icon: <FormatListBulletedIcon />,
  },
  {
    to: '/dashboard/notificaciones',
    title: 'Notificaciones',
    description: 'Revisa las actualizaciones mas recientes.',
    icon: <NotificationsNoneIcon />,
  },
]

const QuickAction = () => {
  return (
    <section className="dashboardContent">
      <div className="dashboardSectionHeading">
        <span className="dashboardSectionEyebrow">Acciones frecuentes</span>
        <h2>Que deseas hacer?</h2>
        <p>Accede rapidamente a las opciones principales de Campus App.</p>
      </div>

      <div className="dashboardQuickGrid">
        {accesosRapidos.map(({ to, title, description, icon }) => (
          <Link className="dashboardQuickCard" to={to} key={to}>
            <span className="dashboardQuickIcon">{icon}</span>
            <span className="dashboardQuickText">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>

          </Link>
        ))}
      </div>
    </section>
  )
}

export default QuickAction
