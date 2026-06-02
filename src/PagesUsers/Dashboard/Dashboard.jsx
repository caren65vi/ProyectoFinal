import React from 'react'
import './Dashboard.css'
import NavDash from '../NavDash/NavDash'
import QuickAction from '../QuickAction/QuickAction'
import Consejos from '../Consejos/Consejos'

const Dashboard = () => {
  return (
    <div className="dashboard">
      <NavDash />
      <div className="dashboard__body">
        <main className="dashboard__main">
          <QuickAction />
        </main>
        <aside className="dashboard__sidebar">
          <Consejos />
        </aside>
      </div>
    </div>
  )
}

export default Dashboard