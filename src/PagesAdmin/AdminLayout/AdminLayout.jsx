import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import IncidentNotifier from '../../Components/IncidentNotifier/IncidentNotifier'
import ModalSetPassword from '../../Components/ModalSetPassword/ModalSetPassword'
import NavAdmin from '../NavAdmin/NavAdmin'
import { onAuthChange, fetchRolByUid } from '../../FireBase/auth'
import './AdminLayout.css'

const AdminLayout = () => {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        navigate('/login', { replace: true })
        setChecking(false)
        return
      }
      const rol = await fetchRolByUid(firebaseUser)
      if (rol !== 'admin') {
        navigate('/dashboard', { replace: true })
      }
      setChecking(false)
    })
    return () => unsub()
  }, [navigate])

  if (checking) return null

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
