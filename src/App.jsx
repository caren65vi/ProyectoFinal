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
import Dashboard from './PagesUsers/Dashboard/Dashboard'
import Reportar from './PagesUsers/Reportar/Reportar'
import MisIncidentes from './PagesUsers/MisIncidentes/MisIncidentes'
import Estadisticas from './PagesUsers/Estadisticas/Estadisticas'
import Notificaciones from './PagesUsers/Notificaciones/Notificaciones'
import Register from './Components/Register/Register.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><BrowserHome /><Main /><Feature /><Pasos /><Cta /><Footer /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<UserLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="reportar" element={<Reportar />} />
          <Route path="mis-incidentes" element={<MisIncidentes />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="notificaciones" element={<Notificaciones />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
