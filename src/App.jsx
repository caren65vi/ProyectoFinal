import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './Components/Login/Login.jsx'
import BrowserHome from './Components/BrowserHome/BrowserHome'
import Main from './Components/Main/Main'
import Feature from './Components/Feature/Feature.jsx'
import UserLayout from './PagesUsers/UserLayout/UserLayout'
import Dashboard from './PagesUsers/Dashboard/Dashboard'
import Reportar from './PagesUsers/Reportar/Reportar'
import MisIncidentes from './PagesUsers/MisIncidentes/MisIncidentes'
import Estadisticas from './PagesUsers/Estadisticas/Estadisticas'
import Notificaciones from './PagesUsers/Notificaciones/Notificaciones'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><BrowserHome /><Main /><Feature /></>} />
        <Route path="/login" element={<Login />} />
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
