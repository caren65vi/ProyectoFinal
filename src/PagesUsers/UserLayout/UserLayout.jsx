import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import NavUser from '../Navuser/NavUser'
import IncidentNotifier from '../../Components/IncidentNotifier/IncidentNotifier'
import ModalSetPassword from '../../Components/ModalSetPassword/ModalSetPassword'
import { onAuthChange, fetchRolByUid } from '../../FireBase/auth'
import './UserLayout.css'

const UserLayout = () => {
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
      if (rol === 'admin') {
        navigate('/admin', { replace: true })
      }
      setChecking(false)
    })
    return () => unsub()
  }, [navigate])

  if (checking) return null

  return (
    <div className="userLayout">
      <NavUser />
      <main className="userLayoutContent">
        <Outlet />
      </main>
      <IncidentNotifier />
      <ModalSetPassword />
    </div>
  )
}

export default UserLayout
