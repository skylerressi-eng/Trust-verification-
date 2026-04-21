import { Routes, Route, Navigate } from 'react-router-dom'
import { useTrust } from './store/trustStore'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Architecture from './pages/Architecture'

export default function App() {
  const { registered } = useTrust()

  return (
    <div className="min-h-screen bg-void-950 relative">
      <div className="scanline" />
      <div className="bg-grid fixed inset-0 pointer-events-none" />
      <Navbar />
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/dashboard"   element={registered ? <Dashboard /> : <Navigate to="/register" />} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
