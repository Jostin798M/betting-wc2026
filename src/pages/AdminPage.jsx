import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  UserIcon, BallIcon, CheckIcon, XIcon, PlusIcon, ChipIcon, SettingsIcon
} from '../assets/Icons'

// ============================================
// CREATE USER MODAL
// ============================================
function CreateUserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', chips: '100' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          chips: parseFloat(form.chips),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Error al crear usuario')
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Crear nuevo usuario</span>
          <button className="modal-close" onClick={onClose}><XIcon size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nombre de usuario</label>
            <input className="form-input" required placeholder="jugador123"
              value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" required placeholder="usuario@email.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Contrasena</label>
            <input type="password" className="form-input" required placeholder="min 6 caracteres"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Fichas iniciales</label>
            <input type="number" className="form-input" required min="1"
              value={form.chips} onChange={e => setForm(f => ({ ...f, chips: e.target.value }))} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-block" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Creando...</> : <><PlusIcon size={16} /> Crear usuario</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// SET RESULT MODAL
// ============================================
function SetResultModal({ match, onClose, onSuccess }) {
  const [s1, setS1] = useState(String(match.team1_score ?? 0))
  const [s2, setS2] = useState(String(match.team2_score ?? 0))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: rpcErr } = await supabase.rpc('settle_match_bets', {
      p_match_id: match.id,
      p_team1_score: parseInt(s1, 10),
      p_team2_score: parseInt(s2, 10),
    })
    setLoading(false)
    if (rpcErr) { setError(rpcErr.message); return }
    onSuccess?.()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Registrar resultado</span>
          <button className="modal-close" onClick={onClose}><XIcon size={20} /></button>
        </div>
        <div className="modal-teams" style={{ marginBottom: 20 }}>
          <div className="modal-team">
            <div className="modal-team-flag">
              <span className={`fi fi-${match.team1_code}`} style={{ width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }} />
            </div>
            <span className="modal-team-name">{match.team1}</span>
          </div>
          <span className="modal-vs">VS</span>
          <div className="modal-team">
            <div className="modal-team-flag">
              <span className={`fi fi-${match.team2_code}`} style={{ width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }} />
            </div>
            <span className="modal-team-name">{match.team2}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center' }}>{match.team1}</label>
              <input type="number" className="form-input" min="0" required
                value={s1} onChange={e => setS1(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 900 }} />
            </div>
            <span style={{ color: 'var(--text-3)', fontWeight: 700 }}>—</span>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center' }}>{match.team2}</label>
              <input type="number" className="form-input" min="0" required
                value={s2} onChange={e => setS2(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 900 }} />
            </div>
          </div>
          <div style={{ background: 'var(--orange-bg)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--orange)' }}>
            Al confirmar se liquidaran automaticamente todas las apuestas pendientes de este partido.
          </div>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-block" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Liquidando...</> : <><CheckIcon size={16} /> Confirmar resultado</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// ADMIN PAGE
// ============================================
export default function AdminPage() {
  const { profile } = useAuth()
  const [section, setSection] = useState('matches')
  const [matches, setMatches] = useState([])
  const [users, setUsers] = useState([])
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [resultModal, setResultModal] = useState(null)
  const [matchFilter, setMatchFilter] = useState('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [matchRes, userRes, betRes] = await Promise.all([
      supabase.from('matches').select('*').order('match_datetime', { ascending: true }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('bets').select('*').order('created_at', { ascending: false }),
    ])
    if (matchRes.data) setMatches(matchRes.data)
    if (userRes.data) setUsers(userRes.data)
    if (betRes.data) setBets(betRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function setMatchLive(matchId) {
    await supabase.from('matches').update({ status: 'live', betting_closed: true }).eq('id', matchId)
    fetchAll()
  }

  const filteredMatches = matchFilter === 'all' ? matches
    : matches.filter(m => m.status === matchFilter)

  function formatDate(iso) {
    return new Date(iso).toLocaleString('es-EC', {
      timeZone: 'America/Guayaquil',
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const navItems = [
    { key: 'matches', label: 'Partidos', icon: BallIcon },
    { key: 'users', label: 'Usuarios', icon: UserIcon },
    { key: 'bets', label: 'Apuestas', icon: ChipIcon },
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Panel de Administracion</h1>
        <p className="page-subtitle">Control total del sistema — {profile?.username}</p>
      </div>

      <div className="admin-grid">
        <div className="admin-sidebar">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`admin-nav-item${section === key ? ' active' : ''}`} onClick={() => setSection(key)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <>
              {/* ---- MATCHES ---- */}
              {section === 'matches' && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                      Partidos ({matches.length})
                    </h2>
                    <select className="form-input" style={{ width: 'auto', fontSize: '0.78rem', padding: '5px 10px' }}
                      value={matchFilter} onChange={e => setMatchFilter(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="upcoming">Proximos</option>
                      <option value="live">En vivo</option>
                      <option value="finished">Finalizados</option>
                    </select>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Partido</th>
                          <th>Grupo</th>
                          <th>Fecha (EC)</th>
                          <th>Estado</th>
                          <th>Resultado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMatches.map(m => (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={`fi fi-${m.team1_code}`} style={{ width: 18, height: 13, backgroundSize: 'cover', borderRadius: 2 }} />
                                {m.team1}
                                <span style={{ color: 'var(--text-3)' }}>vs</span>
                                <span className={`fi fi-${m.team2_code}`} style={{ width: 18, height: 13, backgroundSize: 'cover', borderRadius: 2 }} />
                                {m.team2}
                              </span>
                            </td>
                            <td><span className="badge badge-group">{m.group_name || '—'}</span></td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(m.match_datetime)}</td>
                            <td>
                              <span className={`badge badge-${m.status}`}>
                                {m.status === 'upcoming' ? 'Proximo' : m.status === 'live' ? 'En vivo' : 'Finalizado'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                              {m.status === 'finished' ? `${m.team1_score} - ${m.team2_score}` : '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {m.status === 'upcoming' && (
                                  <button className="btn btn-sm btn-outline" onClick={() => setMatchLive(m.id)}>
                                    En vivo
                                  </button>
                                )}
                                {(m.status === 'upcoming' || m.status === 'live') && (
                                  <button className="btn btn-sm btn-gold" onClick={() => setResultModal(m)}>
                                    Resultado
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ---- USERS ---- */}
              {section === 'users' && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                      Usuarios ({users.length})
                    </h2>
                    <button className="btn btn-gold btn-sm" onClick={() => setShowCreateUser(true)}>
                      <PlusIcon size={16} /> Crear usuario
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Email</th>
                          <th>Rol</th>
                          <th>Balance</th>
                          <th>Registro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => {
                          const userBetsCount = bets.filter(b => b.user_id === u.id).length
                          return (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'var(--gold-glow)', border: '1px solid rgba(240,180,41,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800,
                                    flexShrink: 0
                                  }}>
                                    {u.username[0].toUpperCase()}
                                  </div>
                                  {u.username}
                                </div>
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`badge ${u.role === 'admin' ? 'badge-live' : 'badge-upcoming'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontWeight: 700 }}>
                                  <ChipIcon size={14} /> {Number(u.chips_balance).toFixed(0)}
                                </div>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                                {formatDate(u.created_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ---- BETS ---- */}
              {section === 'bets' && (
                <div className="card">
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
                    Todas las apuestas ({bets.length})
                  </h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Partido</th>
                          <th>Prediccion</th>
                          <th>Monto</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bets.map(b => {
                          const user = users.find(u => u.id === b.user_id)
                          const match = matches.find(m => m.id === b.match_id)
                          const predLabel = b.bet_type === 'draw' ? 'Empate'
                            : b.bet_type === 'team1_win' ? `Gana ${match?.team1 || '?'}`
                            : `Gana ${match?.team2 || '?'}`
                          return (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600 }}>{user?.username || '—'}</td>
                              <td style={{ fontSize: '0.78rem' }}>
                                {match ? `${match.team1} vs ${match.team2}` : '—'}
                              </td>
                              <td>{predLabel}</td>
                              <td style={{ color: 'var(--gold)', fontWeight: 700 }}>
                                {Number(b.amount).toFixed(0)}
                              </td>
                              <td><span className={`badge badge-${b.status}`}>
                                {b.status === 'pending' ? 'Pendiente' : b.status === 'won' ? 'Ganada' : 'Perdida'}
                              </span></td>
                              <td style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                                {formatDate(b.created_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {bets.length === 0 && (
                      <div className="empty-state"><p className="empty-state-text">Sin apuestas registradas</p></div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreateUser && (
        <CreateUserModal onClose={() => setShowCreateUser(false)} onSuccess={fetchAll} />
      )}
      {resultModal && (
        <SetResultModal match={resultModal} onClose={() => setResultModal(null)} onSuccess={fetchAll} />
      )}
    </div>
  )
}
