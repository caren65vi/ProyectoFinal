import './Dashboard.css'
import NavDash from '../NavDash/NavDash'
import QuickAction from '../QuickAction/QuickAction'
import Consejos from '../Consejos/Consejos'

const Dashboard = () => {
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
