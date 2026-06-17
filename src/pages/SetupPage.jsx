import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrophyIcon, CheckIcon, ShieldIcon, ChipIcon, BallIcon } from '../assets/Icons'

function Step({ num, label, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: done ? 'var(--green-bg)' : 'var(--gold-glow)',
        border: `1.5px solid ${done ? 'var(--green)' : 'var(--gold)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: done ? 'var(--green)' : 'var(--gold)', fontSize: '0.72rem', fontWeight: 800
      }}>
        {done ? <CheckIcon size={14} /> : num}
      </div>
      <span style={{ fontSize: '0.82rem', color: done ? 'var(--text-2)' : 'var(--text-1)', fontWeight: done ? 400 : 500 }}>
        {label}
      </span>
    </div>
  )
}

export default function SetupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ adminUsername: '', adminEmail: '', adminPassword: '' })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ tables: false, policies: false, functions: false, matches: false, admin: false })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Verify we actually need setup
    fetch('/api/setup').then(r => r.json()).then(d => {
      if (d.initialized) navigate('/login', { replace: true })
    }).catch(() => {})
  }, [navigate])

  async function handleSetup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setProgress({ tables: false, policies: false, functions: false, matches: false, admin: false })

    // Animate progress steps
    const steps = ['tables', 'policies', 'functions', 'matches', 'admin']
    let stepIdx = 0
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++
        setProgress(p => ({ ...p, [steps[stepIdx - 1]]: true }))
      }
    }, 800)

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      clearInterval(interval)

      if (!data.success) {
        setError(data.error || 'Error desconocido durante la configuracion')
        setProgress({ tables: false, policies: false, functions: false, matches: false, admin: false })
        setLoading(false)
        return
      }

      setProgress({ tables: true, policies: true, functions: true, matches: true, admin: true })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      clearInterval(interval)
      setError('No se pudo conectar con el servidor. Verifica que las variables de entorno esten configuradas.')
      setProgress({ tables: false, policies: false, functions: false, matches: false, admin: false })
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <svg className="field-lines" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <rect x="40" y="40" width="720" height="520" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="400" cy="300" r="80" fill="none" stroke="white" strokeWidth="2" />
          <line x1="400" y1="40" x2="400" y2="560" stroke="white" strokeWidth="2" />
          <rect x="40" y="190" width="120" height="220" fill="none" stroke="white" strokeWidth="2" />
          <rect x="640" y="190" width="120" height="220" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      <div className="login-card" style={{ maxWidth: done || loading ? 480 : 420 }}>
        <div className="login-header">
          <div className="login-logo">
            <TrophyIcon size={28} />
          </div>
          <h1 className="login-title">Configuracion inicial</h1>
          <p className="login-subtitle">Mundial Bet 2026 — Primera vez</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--green-bg)', border: '2px solid var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: 'var(--green)'
            }}>
              <CheckIcon size={32} />
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green)' }}>Sistema listo</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: 6 }}>
              Redirigiendo al inicio de sesion...
            </p>
          </div>
        ) : loading ? (
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 20 }}>
              <Step num={1} label="Creando tablas de base de datos..." done={progress.tables} />
              <Step num={2} label="Configurando seguridad (RLS)..." done={progress.policies} />
              <Step num={3} label="Instalando funciones del sistema..." done={progress.functions} />
              <Step num={4} label="Cargando 72 partidos del Mundial 2026..." done={progress.matches} />
              <Step num={5} label="Creando cuenta de administrador..." done={progress.admin} />
            </div>
            {error && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--r-md)', padding: '10px 14px',
                fontSize: '0.82rem', color: 'var(--red)', marginBottom: 12
              }}>
                {error}
              </div>
            )}
            {!error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', fontSize: '0.82rem' }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Esto puede tomar unos segundos...
              </div>
            )}
            {error && (
              <button className="btn btn-outline btn-block mt-4" onClick={() => { setLoading(false); setError('') }}>
                Volver e intentar de nuevo
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{
              background: 'var(--blue-bg)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 'var(--r-md)', padding: '12px 14px',
              fontSize: '0.8rem', color: 'var(--blue)', marginBottom: 20
            }}>
              <strong>Solo necesitas hacer esto una vez.</strong> Se crearan las tablas, funciones, los 72 partidos del Mundial y tu cuenta de admin automaticamente.
            </div>

            <form className="login-form" onSubmit={handleSetup}>
              <div className="form-group">
                <label className="form-label">Nombre del administrador</label>
                <input className="form-input" required placeholder="admin"
                  value={form.adminUsername}
                  onChange={e => setForm(f => ({ ...f, adminUsername: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email del administrador</label>
                <input type="email" className="form-input" required placeholder="admin@mundialbet.com"
                  value={form.adminEmail}
                  onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Contrasena (min. 6 caracteres)</label>
                <input type="password" className="form-input" required minLength={6} placeholder="••••••••"
                  value={form.adminPassword}
                  onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} />
              </div>

              {error && (
                <div style={{
                  background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--r-md)', padding: '10px 14px',
                  fontSize: '0.82rem', color: 'var(--red)', display: 'flex', gap: 8, alignItems: 'flex-start'
                }}>
                  <ShieldIcon size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
              )}

              <button type="submit" className="btn btn-gold btn-lg btn-block">
                <BallIcon size={18} /> Inicializar sistema
              </button>
            </form>

            <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 'var(--r-md)', fontSize: '0.75rem', color: 'var(--text-3)' }}>
              <strong style={{ color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Necesitas estas 4 variables en Vercel:</strong>
              <code style={{ display: 'block', color: 'var(--gold)', marginBottom: 2 }}>VITE_SUPABASE_URL</code>
              <code style={{ display: 'block', color: 'var(--gold)', marginBottom: 2 }}>VITE_SUPABASE_ANON_KEY</code>
              <code style={{ display: 'block', color: 'var(--gold)', marginBottom: 2 }}>SUPABASE_SERVICE_ROLE_KEY</code>
              <code style={{ display: 'block', color: 'var(--gold)' }}>DATABASE_URL</code>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
