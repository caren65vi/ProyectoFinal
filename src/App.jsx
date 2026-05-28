import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './App.css'
import Login from './Components/Login/Login.jsx'
import BrowserHome from './Components/BrowserHome/BrowserHome'
import Main from './Components/Main/Main'  

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BrowserHome />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    {/* <Main /> */}
    </BrowserRouter>
  )
}

export default App
