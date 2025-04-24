import React from 'react'
import './App.css'
import {Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Layout from './Layout'
import RedirectIfAuthenticated from './guards/RedirectIfAuthenticated'
import RequireAuth from './guards/RequireAuth'
import { useAuth } from './context/AuthContext'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
          <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
        </Route>
      </Routes>
    </>
  )
}

export default App
