import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TrophyIcon, BallIcon, ShieldIcon } from '../../assets/Icons'

function FieldLines() {
  return (
    <svg className="field-lines" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <rect x="40" y="40" width="720" height="520" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="400" cy="300" r="80" fill="none" stroke="white" strokeWidth="2" />
      <line x1="400" y1="40" x2="400" y2="560" stroke="white" strokeWidth="2" />
      <rect x="40" y="190" width="120" height="220" fill="none" stroke="white" strokeWidth="2" />
      <rect x="640" y="190" width="120" height="220" fill="none" stroke="white" strokeWidth="2" />
      <rect x="40" y="240" width="50" height="120" fill="none" stroke="white" strokeWidth="1.5" />
      <rect x="710" y="240" width="50" height="120" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="160" cy="300" r="8" fill="white" />
      <circle cx="640" cy="300" r="8" fill="white" />
      <circle cx="400" cy="300" r="4" fill="white" />
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(email, password)
    if (err) {
      setError('Credenciales incorrectas. Verifica tu email y contrasena.')
      setLoading(false)
    } else {
      navigate('/betting')
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <FieldLines />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <TrophyIcon size={28} />
          </div>
          <h1 className="login-title">Mundial Bet 2026</h1>
          <p className="login-subtitle">Inicia sesion para continuar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--r-md)', padding: '10px 14px',
              fontSize: '0.82rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <ShieldIcon size={16} /> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Correo electronico</label>
            <input
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contrasena</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-gold btn-lg btn-block" disabled={loading}>
            {loading ? <><div className="spinner" style={{width:18,height:18,borderWidth:2}} /> Ingresando...</> : <><BallIcon size={18} /> Ingresar</>}
          </button>
        </form>

        <div className="login-divider" style={{ marginTop: 24 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            Solo el administrador puede crear cuentas
          </span>
        </div>
      </div>
    </div>
  )
}
