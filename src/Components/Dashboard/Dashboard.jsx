import './Dashboard.css'
import NavDash from '../../PagesUsers/NavDash/NavDash'
import QuickAction from '../../PagesUsers/QuickAction/QuickAction'
import Consejos from '../../PagesUsers/Consejos/Consejos'
import DashboardAdmin from '../../PagesAdmin/DashboardAdmin/DashboardAdmin'

const Dashboard = ({ role = 'usuario' }) => {
  if (role === 'admin') {
    return <DashboardAdmin />
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
