import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import './NavDash.css'
import Button from '../../Components/Button/Button'
import { onAuthChange } from '../../FireBase/auth'
import { db } from '../../FireBase/config'
import { doc, getDoc } from 'firebase/firestore'

const NavDash = () => {
  const navigate = useNavigate()
  const [nombreCliente, setNombreCliente] = useState('Usuario')

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) { setNombreCliente('Usuario'); return }
      try {
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        const nombre = snap.exists() ? snap.data()?.nombre : null
        setNombreCliente(typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Usuario')
      } catch {
        setNombreCliente('Usuario')
      }
    })
    return () => unsub()
  }, [])
  
  const hoy = new Date()
  const fechaFormateada = hoy.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <nav className="navDash">
      <div className="navDashLeft">
        <span className="navDashEyebrow">Panel principal</span>
        <div className="navDashMobileMeta">
          <p className="navDashBienvenido">Bienvenido, {nombreCliente}</p>
          <span className="navDashMobileFecha">{fechaFormateada}</span>
        </div>
      </div>

      <div className="navDashFecha">
        <span className="navDashFechaTexto">{fechaFormateada}</span>
      </div>

      <Button
        className="navDashButton"
        startIcon={<AddCircleOutlineIcon className="navDashBtnIcon" />}
        onClick={() => navigate('/dashboard/reportar')}
      >
        <span className="navDashButtonText">Nuevo reporte</span>
      </Button>
    </nav>
  )
}

export default NavDash
