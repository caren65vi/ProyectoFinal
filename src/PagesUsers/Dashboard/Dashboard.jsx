import React from 'react'
import './Dashboard.css'
import NavDash from '../NavDash/NavDash'
import QuickAction from '../QuickAction/QuickAction'

const Dashboard = () => {
  return (
    <div className="dashboard">
      <NavDash />
      <QuickAction />
    </div>
  )
}

export default Dashboard
