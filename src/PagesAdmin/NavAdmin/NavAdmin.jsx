import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { doSignOut, onAuthChange } from '../../FireBase/auth'
import { db } from '../../FireBase/config'
import './NavAdmin.css'

const sections = [
  {
    title: 'GENERAL',
    items: [
      { to: '/admin', label: 'Dashboard', icon: <DashboardOutlinedIcon />, end: true },
      { to: '/admin/incidentes', label: 'Incidentes', icon: <FormatListBulletedIcon /> },
      { to: '/admin/agrupar', label: 'Agrupar', icon: <AccountTreeOutlinedIcon /> },
    ],
  },
  {
    title: 'REPORTES',
    items: [
      { to: '/admin/estadisticas', label: 'Estadísticas', icon: <BarChartOutlinedIcon /> },
      { to: '/admin/imprimir', label: 'Imprimir', icon: <PrintOutlinedIcon /> },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { to: '/admin/usuarios', label: 'Usuarios', icon: <GroupOutlinedIcon /> },
      { to: '/admin/notificaciones', label: 'Notificaciones', icon: <NotificationsNoneIcon /> },
      { to: '/admin/datos-personales', label: 'Datos Personales', icon: <PersonOutlinedIcon /> },
    ],
  },
]

const NavAdmin = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [userName, setUserName] = useState('Administrador')
  const [fbUser, setFbUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setFbUser(firebaseUser)
      if (!firebaseUser) {
        setUserName('Administrador')
        return
      }

      try {
        const snapshot = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        const nombre = snapshot.exists() ? snapshot.data()?.nombre : null
        setUserName(typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Administrador')
      } catch {
        setUserName('Administrador')
      }
    })

    return () => unsubscribe()
  }, [])

  const close = () => setIsOpen(false)

  const signOut = async () => {
    await doSignOut()
    navigate('/login')
  }

  return (
    <>
      <div className="navAdminMobileBar">
        <strong>ReportaUdla</strong>
        <button type="button" onClick={() => setIsOpen(true)} aria-label="Abrir menu">
          <MenuIcon />
        </button>
      </div>

      {isOpen && <div className="navAdminOverlay" onClick={close} />}

      <nav className={`navAdmin${isOpen ? ' navAdminOpen' : ''}`}>
        <header className="navAdminBrand">
          <span className="navAdminLogo"><ShieldOutlinedIcon /></span>
          <div>
            <strong>ReportaUdla</strong>
            <small>Admin</small>
          </div>
          <button className="navAdminClose" type="button" onClick={close} aria-label="Cerrar menu">
            <CloseIcon />
          </button>
        </header>

        <div className="navAdminBody">
          {sections.map(({ title, items }) => (
            <section className="navAdminSection" key={title}>
              <span>{title}</span>
              {items.map(({ to, label, icon, end }) => (
                <NavLink
                  className={({ isActive }) => `navAdminLink${isActive ? ' navAdminLinkActive' : ''}`}
                  end={end}
                  key={to}
                  onClick={close}
                  to={to}
                >
                  {icon}
                  <strong>{label}</strong>
                </NavLink>
              ))}
            </section>
          ))}
        </div>

        <footer className="navAdminFooter">
          <div className="navAdminUser">
            {fbUser?.photoURL
              ? <img src={fbUser.photoURL} alt="avatar" className="navAdminAvatar" />
              : <AccountCircleIcon className="navAdminAvatarIcon" />
            }
            <div className="navAdminUserInfo">
              <strong className="navAdminUserName">{userName}</strong>
              <small className="navAdminUserRole">Administrador</small>
            </div>
          </div>
          <button type="button" className="navAdminSignOut" onClick={signOut}>
            <LogoutIcon />
            <span>Cerrar sesión</span>
          </button>
        </footer>
      </nav>
    </>
  )
}

export default NavAdmin
