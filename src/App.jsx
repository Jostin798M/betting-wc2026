import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './components/auth/Login'
import SetupPage from './pages/SetupPage'
import BettingPage from './pages/BettingPage'
import BankPage from './pages/BankPage'
import AdminPage from './pages/AdminPage'

function useInitialized() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then(d => setStatus(d.initialized ? 'ready' : 'setup'))
      .catch(() => setStatus('setup')) // si falla el API, mostrar setup
  }, [])

  return status
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/betting" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const initStatus = useInitialized()

  if (initStatus === 'loading') return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Verificando sistema...</span>
    </div>
  )

  // /setup siempre accesible directamente
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />

      {initStatus === 'setup' ? (
        <Route path="*" element={<SetupPage />} />
      ) : (
        <>
          <Route path="/login" element={user ? <Navigate to="/betting" replace /> : <Login />} />
          <Route path="/" element={<Navigate to="/betting" replace />} />
          <Route element={<Layout />}>
            <Route path="/betting" element={<ProtectedRoute><BettingPage /></ProtectedRoute>} />
            <Route path="/bank" element={<ProtectedRoute><BankPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          </Route>
        </>
      )}
    </Routes>
  )
}
