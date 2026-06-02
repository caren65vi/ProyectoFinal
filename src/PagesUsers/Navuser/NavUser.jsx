import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { onAuthChange, doSignOut } from '../../FireBase/auth'
import { db } from '../../FireBase/config'
import { doc, getDoc } from 'firebase/firestore'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import BarChartIcon from '@mui/icons-material/BarChart'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import './NavUser.css'

const PRINCIPAL = [
  { to: '/dashboard',          label: 'Dashboard',  icon: <DashboardIcon />,         end: true },
  { to: '/dashboard/reportar', label: 'Reportar',   icon: <AddCircleOutlineIcon /> },
]

const misReportes = [
  { to: '/dashboard/mis-incidentes', label: 'Mis incidentes', icon: <FormatListBulletedIcon /> },
  { to: '/dashboard/datos-personales', label: 'Datos Personales', icon: <BarChartIcon /> },
  { to: '/dashboard/notificaciones', label: 'Notificaciones', icon: <NotificationsNoneIcon /> },
]

const NavUser = () => {
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('Usuario')
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) { setUserName('Usuario'); return }
      try {
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        const nombre = snap.exists() ? snap.data()?.nombre : null
        setUserName(typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Usuario')
      } catch {
        setUserName('Usuario')
      }
    })
    return () => unsub()
  }, [])

  const close = () => setIsOpen(false)

  return (
    <>
      {/* Barra superior — solo visible en móvil */}
      <div className="navUserMobileBar">
        <span className="navUserMobileTitle">Campus App</span>
        <button className="navUserHamburger" onClick={() => setIsOpen(true)} aria-label="Abrir menú">
          <MenuIcon />
        </button>
      </div>

      {/* Backdrop al abrir en móvil */}
      {isOpen && <div className="navUserOverlay" onClick={close} />}

      <nav className={`navUser${isOpen ? ' navUserOpen' : ''}`}>

        {/* Branding */}
        <div className="navUserBrand">
          <div className="navUserBrandText">
            <span className="navUserBrandLabel">UDLA INCIDENTES</span>
            <span className="navUserBrandTitle">Campus App</span>
            <span className="navUserBrandSub">Universidad de la Amazonia</span>
          </div>
          <button className="navUserClose" onClick={close} aria-label="Cerrar menú">
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="navUserBody">
          <NavSection title="PRINCIPAL"    items={PRINCIPAL}    onNav={close} />
          <NavSection title="MIS REPORTES" items={misReportes} onNav={close} />
        </div>

        <div className="navUserUser">
          <div className="navUserUserRow">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="navUserAvatar" />
            ) : (
              <AccountCircleIcon className="navUserAvatarIcon" />
            )}
            <div className="navUserUserInfo">
              <span className="navUserUserName">{userName}</span>
              {user && <span className="navUserUserEmail">{user.email}</span>}
            </div>
          </div>
          {user && (
            <button
              type="button"
              className="navUserSignOut"
              onClick={async () => { await doSignOut(); navigate('/login') }}
            >
              <LogoutIcon fontSize="small" />
              Cerrar sesión
            </button>
          )}
        </div>
      </nav>
    </>
  )
}

const NavSection = ({ title, items, onNav }) => (
  <div className="navUserSection">
    <span className="navUserSectionTitle">{title}</span>
    <ul className="navUserList">
      {items.map(({ to, label, icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNav}
            className={({ isActive }) => `navUserLink${isActive ? ' navUserLinkActive' : ''}`}
          >
            <span className="navUserIcon">{icon}</span>
            <span className="navUserLabel">{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
)

export default NavUser
