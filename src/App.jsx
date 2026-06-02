import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './Components/Login/Login.jsx'
import BrowserHome from './Components/BrowserHome/BrowserHome.jsx'
import Main from './Components/Main/Main.jsx'
import Feature from './Components/Feature/Feature.jsx'
import Pasos from './Components/Pasos/Pasos.jsx'
import UserLayout from './PagesUsers/UserLayout/UserLayout'
import Cta from './Components/Cta/Cta.jsx'
import Footer from './Components/Footer/Footer.jsx'
import Dashboard from './Components/Dashboard/Dashboard'
import Reportar from './PagesUsers/Reportar/Reportar'
import NavIncidente from './PagesUsers/NavIncidente/NavIncidente'
import DatosPersonales from './Components/DatosPersonales/DatosPersonales'
import Notificaciones from './Components/Notificaciones/Notificaciones'
import Register from './Components/Register/Register.jsx'
import ReportarAnonimo from './PagesUsers/ReportarAnonimo/ReportarAnonimo.jsx'
import AdminLayout from './PagesAdmin/AdminLayout/AdminLayout'
import IncidentesAdmin from './PagesAdmin/Incidentes/IncidentesAdmin'
import AgruparAdmin from './PagesAdmin/Agrupar/AgruparAdmin'
import EstadisticasAdmin from './PagesAdmin/Estadisticas/EstadisticasAdmin'
import ImprimirAdmin from './PagesAdmin/Imprimir/ImprimirAdmin'
import UsuariosAdmin from './PagesAdmin/Usuarios/UsuariosAdmin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><BrowserHome /><Main /><Feature /><Pasos /><Cta /><Footer /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reportar-anonimo" element={<ReportarAnonimo />} />
        <Route path="/dashboard" element={<UserLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="reportar" element={<Reportar />} />
          <Route path="mis-incidentes" element={<NavIncidente />} />
          <Route path="datos-personales" element={<DatosPersonales />} />
          <Route path="notificaciones" element={<Notificaciones />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard role="admin" />} />
          <Route path="incidentes" element={<IncidentesAdmin />} />
          <Route path="agrupar" element={<AgruparAdmin />} />
          <Route path="estadisticas" element={<EstadisticasAdmin />} />
          <Route path="imprimir" element={<ImprimirAdmin />} />
          <Route path="usuarios" element={<UsuariosAdmin />} />
          <Route path="notificaciones" element={<Notificaciones />} />
          <Route path="datos-personales" element={<DatosPersonales />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
