import './Dashboard.css'
import NavDash from '../../PagesUsers/NavDash/NavDash'
import QuickAction from '../../PagesUsers/QuickAction/QuickAction'
import Consejos from '../../PagesUsers/Consejos/Consejos'

const Dashboard = ({ role = 'usuario' }) => {
  if (role === 'admin') {
    return (
      <div className="dashboard">
        <NavDash role="admin" />
        <section className="dashboardAdminIntro">
          <span>Administracion del sistema</span>
          <h1>Dashboard administrativo</h1>
          <p>Usa el menu lateral para gestionar incidentes, reportes y usuarios.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <NavDash />
      <div className="dashboardBody">
        <main className="dashboardMain">
          <QuickAction />
        </main>
        <aside className="dashboardSidebar">
          <Consejos />
        </aside>
      </div>
    </div>
  )
}

export default Dashboard
