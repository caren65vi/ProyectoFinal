import { Outlet } from 'react-router-dom'
import IncidentNotifier from '../../Components/IncidentNotifier/IncidentNotifier'
import ModalSetPassword from '../../Components/ModalSetPassword/ModalSetPassword'
import NavAdmin from '../NavAdmin/NavAdmin'
import './AdminLayout.css'

const AdminLayout = () => {
  return (
    <div className="adminLayout">
      <NavAdmin />
      <main className="adminLayoutContent">
        <Outlet />
      </main>
      <IncidentNotifier />
      <ModalSetPassword />
    </div>
  )
}

export default AdminLayout
