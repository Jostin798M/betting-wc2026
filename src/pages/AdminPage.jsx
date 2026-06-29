import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  UserIcon, BallIcon, CheckIcon, XIcon, PlusIcon, ChipIcon, SettingsIcon, WorldIcon, ArrowUpIcon, ArrowDownIcon
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
    if (rpcErr) {
      setError(`Error al liquidar: ${rpcErr.message}`)
      return
    }
    if (data && !data.success) {
      setError(`Error: ${data.error || 'No se pudo liquidar'}`)
      return
    }
    onSuccess?.()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-scrollable">
        <div className="modal-header">
          <span className="modal-title">Registrar resultado</span>
          <button className="modal-close" onClick={onClose}><XIcon size={20} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span className={`fi fi-${match.team1_code}`} style={{ width: 40, height: 28, backgroundSize: 'cover', borderRadius: 4, display: 'block' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', textAlign: 'center', maxWidth: 90 }}>{match.team1}</span>
          </div>
          <span style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '0.85rem' }}>VS</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span className={`fi fi-${match.team2_code}`} style={{ width: 40, height: 28, backgroundSize: 'cover', borderRadius: 4, display: 'block' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', textAlign: 'center', maxWidth: 90 }}>{match.team2}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>{match.team1}</label>
              <input type="number" className="form-input" min="0" required
                value={s1} onChange={e => setS1(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 900 }} />
            </div>
            <span style={{ color: 'var(--text-3)', fontWeight: 700, paddingBottom: 8 }}>—</span>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>{match.team2}</label>
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
// ADJUST BALANCE MODAL
// ============================================
function AdjustBalanceModal({ user, matches, onClose, onSuccess }) {
  const [mode, setMode] = useState('retro') // 'manual' | 'retro'
  // retro mode
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [betType, setBetType] = useState('') // 'team1_win' | 'draw' | 'team2_win'
  const [retroAmount, setRetroAmount] = useState('')
  // manual mode
  const [manualAmount, setManualAmount] = useState('')
  const [manualDesc, setManualDesc] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const finishedMatches = matches.filter(m => m.status === 'finished')
  const selectedMatch = finishedMatches.find(m => m.id === selectedMatchId)

  function getMatchResult(m) {
    if (!m) return null
    if (m.team1_score > m.team2_score) return 'team1_win'
    if (m.team1_score < m.team2_score) return 'team2_win'
    return 'draw'
  }

  const matchResult = getMatchResult(selectedMatch)
  const retroWon = betType && matchResult ? betType === matchResult : null
  const retroAmountNum = parseFloat(retroAmount) || 0

  function predLabel(type, m) {
    if (!m) return ''
    if (type === 'draw') return 'Empate'
    if (type === 'team1_win') return `Gana ${m.team1}`
    return `Gana ${m.team2}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let currentBalance = Number(user.chips_balance)

      if (mode === 'retro') {
        if (!selectedMatch) throw new Error('Selecciona un partido')
        if (!betType) throw new Error('Selecciona el tipo de apuesta')
        if (retroAmountNum <= 0) throw new Error('Ingresa un monto valido')

        const matchInfo = `${selectedMatch.team1} vs ${selectedMatch.team2}`
        const pred = predLabel(betType, selectedMatch)
        const won = betType === matchResult
        const potentialWin = retroAmountNum * 2

        // 1. Insertar bet record
        const { data: betData, error: betErr } = await supabase.from('bets').insert({
          user_id: user.id,
          match_id: selectedMatch.id,
          bet_type: betType,
          amount: retroAmountNum,
          status: won ? 'won' : 'lost',
          potential_win: potentialWin,
          settled_at: new Date().toISOString(),
        }).select().single()
        if (betErr) throw new Error(betErr.message)

        const betId = betData.id

        // 2. Transaccion: apuesta colocada (descuenta)
        const balAfterPlace = currentBalance - retroAmountNum
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: -retroAmountNum,
          type: 'bet_placed',
          description: `Apuesta retroactiva: ${matchInfo} — ${pred}`,
          balance_after: balAfterPlace,
          related_bet_id: betId,
          match_info: matchInfo,
        })

        let finalBalance = balAfterPlace

        // 3. Si gano: transaccion de premio
        if (won) {
          finalBalance = balAfterPlace + potentialWin
          await supabase.from('transactions').insert({
            user_id: user.id,
            amount: potentialWin,
            type: 'bet_won',
            description: `Apuesta ganada: ${matchInfo} — ${pred}`,
            balance_after: finalBalance,
            related_bet_id: betId,
            match_info: matchInfo,
          })
        }

        // 4. Actualizar balance
        const { error: balErr } = await supabase.from('profiles')
          .update({ chips_balance: finalBalance, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (balErr) throw new Error(balErr.message)

      } else {
        // Manual
        const delta = parseFloat(manualAmount)
        if (isNaN(delta) || delta === 0) throw new Error('Ingresa un monto valido (negativo para descontar)')
        const newBalance = currentBalance + delta
        const { error: balErr } = await supabase.from('profiles')
          .update({ chips_balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (balErr) throw new Error(balErr.message)
        const { error: txErr } = await supabase.from('transactions').insert({
          user_id: user.id,
          amount: delta,
          type: 'admin_adjustment',
          description: manualDesc || 'Ajuste manual de balance',
          balance_after: newBalance,
        })
        if (txErr) throw new Error(txErr.message)
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-scrollable">
        <div className="modal-header">
          <span className="modal-title">Ajustar fichas — {user.username}</span>
          <button className="modal-close" onClick={onClose}><XIcon size={20} /></button>
        </div>

        {/* Balance actual */}
        <div style={{
          background: 'var(--gold-glow)', border: '1px solid rgba(240,180,41,0.25)',
          borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>Balance actual</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChipIcon size={16} /> {Number(user.chips_balance).toFixed(0)} fichas
          </span>
        </div>

        {/* Selector de modo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'retro', label: 'Apuesta retroactiva' },
            { key: 'manual', label: 'Ajuste manual' },
          ].map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              style={{
                padding: '10px', borderRadius: 'var(--r-md)', fontWeight: 700,
                fontSize: '0.82rem', cursor: 'pointer',
                border: `1px solid ${mode === key ? 'rgba(240,180,41,0.5)' : 'var(--border)'}`,
                background: mode === key ? 'var(--gold-glow)' : 'var(--bg-card-2)',
                color: mode === key ? 'var(--gold)' : 'var(--text-2)',
              }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ---- MODO RETROACTIVO ---- */}
          {mode === 'retro' && (
            <>
              <div className="form-group">
                <label className="form-label">Partido finalizado ({finishedMatches.length} disponibles)</label>
                <select className="form-input" value={selectedMatchId}
                  onChange={e => { setSelectedMatchId(e.target.value); setBetType('') }} required>
                  <option value="">— Seleccionar partido —</option>
                  {finishedMatches.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.team1} {m.team1_score} – {m.team2_score} {m.team2} ({m.group_name || m.phase})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatch && (
                <>
                  {/* Resultado del partido */}
                  <div style={{ background: 'var(--bg-0)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>RESULTADO OFICIAL</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <span className={`fi fi-${selectedMatch.team1_code}`} style={{ width: 32, height: 22, backgroundSize: 'cover', borderRadius: 3, display: 'block', margin: '0 auto 4px' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selectedMatch.team1}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>
                          {selectedMatch.team1_score} — {selectedMatch.team2_score}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 2 }}>
                          {matchResult === 'team1_win' ? `Gano ${selectedMatch.team1}`
                            : matchResult === 'team2_win' ? `Gano ${selectedMatch.team2}`
                            : 'Empate'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span className={`fi fi-${selectedMatch.team2_code}`} style={{ width: 32, height: 22, backgroundSize: 'cover', borderRadius: 3, display: 'block', margin: '0 auto 4px' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selectedMatch.team2}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tipo de apuesta */}
                  <div className="form-group">
                    <label className="form-label">El usuario aposto a...</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { key: 'team1_win', label: `Gana\n${selectedMatch.team1}` },
                        { key: 'draw', label: 'Empate' },
                        { key: 'team2_win', label: `Gana\n${selectedMatch.team2}` },
                      ].map(({ key, label }) => {
                        const isCorrect = key === matchResult
                        const isSelected = betType === key
                        return (
                          <button key={key} type="button" onClick={() => setBetType(key)}
                            style={{
                              padding: '10px 6px', borderRadius: 'var(--r-md)',
                              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                              textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.3,
                              border: `1px solid ${isSelected
                                ? isCorrect ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.5)'
                                : 'var(--border)'}`,
                              background: isSelected
                                ? isCorrect ? 'var(--green-bg)' : 'rgba(239,68,68,0.08)'
                                : 'var(--bg-card-2)',
                              color: isSelected
                                ? isCorrect ? 'var(--green)' : 'var(--red)'
                                : 'var(--text-2)',
                            }}>
                            {label}
                            {isCorrect && <div style={{ fontSize: '0.65rem', color: 'var(--green)', marginTop: 3 }}>✓ correcto</div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="form-group">
                    <label className="form-label">Monto apostado (fichas)</label>
                    <input type="number" className="form-input" required min="1" step="1"
                      placeholder="ej: 50"
                      value={retroAmount} onChange={e => setRetroAmount(e.target.value)} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {[10, 25, 50, 100].map(v => (
                        <button key={v} type="button" onClick={() => setRetroAmount(String(v))}
                          className="btn btn-sm btn-outline">{v}</button>
                      ))}
                    </div>
                  </div>

                  {/* Preview resultado */}
                  {betType && retroAmountNum > 0 && (
                    <div style={{
                      background: retroWon ? 'var(--green-bg)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${retroWon ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius: 'var(--r-md)', padding: '12px 14px', fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 700, color: retroWon ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
                        {retroWon ? 'Apuesta GANADA' : 'Apuesta PERDIDA'}
                      </div>
                      {retroWon ? (
                        <div style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
                          Se descontaran <strong>{retroAmountNum}</strong> fichas (apuesta colocada)<br/>
                          Se acreditaran <strong>{retroAmountNum * 2}</strong> fichas (premio)<br/>
                          Ganancia neta: <strong style={{ color: 'var(--green)' }}>+{retroAmountNum} fichas</strong>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
                          Se descontaran <strong>{retroAmountNum}</strong> fichas (apuesta perdida)<br/>
                          Perdida neta: <strong style={{ color: 'var(--red)' }}>-{retroAmountNum} fichas</strong>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ---- MODO MANUAL ---- */}
          {mode === 'manual' && (
            <>
              <div className="form-group">
                <label className="form-label">Monto (positivo = agregar, negativo = descontar)</label>
                <input type="number" className="form-input" required step="1" placeholder="ej: 50 o -30"
                  value={manualAmount} onChange={e => setManualAmount(e.target.value)} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {[50, 100, 200, -50, -100].map(v => (
                    <button key={v} type="button" onClick={() => setManualAmount(String(v))}
                      className="btn btn-sm btn-outline"
                      style={{ color: v < 0 ? 'var(--red)' : 'var(--green)', borderColor: v < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)' }}>
                      {v > 0 ? '+' : ''}{v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripcion</label>
                <input className="form-input" placeholder="Ajuste manual de balance"
                  value={manualDesc} onChange={e => setManualDesc(e.target.value)} />
              </div>
            </>
          )}

          {/* Nuevo balance preview */}
          {((mode === 'manual' && manualAmount !== '') || (mode === 'retro' && betType && retroAmountNum > 0)) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-0)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-3)' }}>Nuevo balance:</span>
              <span style={{ fontWeight: 800, color: 'var(--gold)' }}>
                {mode === 'retro'
                  ? (retroWon
                    ? (Number(user.chips_balance) + retroAmountNum).toFixed(0)
                    : (Number(user.chips_balance) - retroAmountNum).toFixed(0))
                  : (Number(user.chips_balance) + (parseFloat(manualAmount) || 0)).toFixed(0)
                } fichas
              </span>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-block" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Aplicando...</>
                : <><CheckIcon size={16} /> Confirmar</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// CREATE MATCH MODAL
// ============================================
const KNOCKOUT_PHASES = [
  { key: 'round_of_32', label: 'Ronda de 32' },
  { key: 'round_of_16', label: 'Octavos de final' },
  { key: 'quarterfinal', label: 'Cuartos de final' },
  { key: 'semifinal', label: 'Semifinal' },
  { key: 'third_place', label: 'Tercer puesto' },
  { key: 'final', label: 'Final' },
]

function CreateMatchModal({ onClose, onSuccess }) {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const [form, setForm] = useState({
    phase: 'round_of_32',
    team1: '', team1_code: '',
    team2: '', team2_code: '',
    match_datetime: localIso,
    stadium: '', city: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.team1.trim() || !form.team2.trim()) { setError('Completa los nombres de los equipos'); return }
    setLoading(true)
    const { error: err } = await supabase.from('matches').insert({
      phase: form.phase,
      group_name: null,
      team1: form.team1.trim(),
      team1_code: (form.team1_code.trim() || 'un').toLowerCase(),
      team2: form.team2.trim(),
      team2_code: (form.team2_code.trim() || 'un').toLowerCase(),
      match_datetime: new Date(form.match_datetime).toISOString(),
      stadium: form.stadium.trim() || null,
      city: form.city.trim() || null,
      status: 'upcoming',
      betting_closed: false,
      team1_score: 0,
      team2_score: 0,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess?.()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-scrollable">
        <div className="modal-header">
          <span className="modal-title">Crear partido de eliminatoria</span>
          <button className="modal-close" onClick={onClose}><XIcon size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Fase</label>
            <select className="form-input" value={form.phase} onChange={e => set('phase', e.target.value)}>
              {KNOCKOUT_PHASES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Equipo 1</label>
              <input className="form-input" required placeholder="ej: Argentina"
                value={form.team1} onChange={e => set('team1', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Codigo bandera</label>
              <input className="form-input" placeholder="ej: ar" maxLength={4}
                value={form.team1_code} onChange={e => set('team1_code', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Equipo 2</label>
              <input className="form-input" required placeholder="ej: Francia"
                value={form.team2} onChange={e => set('team2', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Codigo bandera</label>
              <input className="form-input" placeholder="ej: fr" maxLength={4}
                value={form.team2_code} onChange={e => set('team2_code', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha y hora (hora local)</label>
            <input type="datetime-local" className="form-input" required
              value={form.match_datetime} onChange={e => set('match_datetime', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Estadio (opcional)</label>
              <input className="form-input" placeholder="ej: MetLife Stadium"
                value={form.stadium} onChange={e => set('stadium', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ciudad (opcional)</label>
              <input className="form-input" placeholder="ej: Nueva York"
                value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-block" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Creando...</> : <><PlusIcon size={16} /> Crear partido</>}
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
  const [showCreateMatch, setShowCreateMatch] = useState(false)
  const [resultModal, setResultModal] = useState(null)
  const [adjustModal, setAdjustModal] = useState(null)
  const [matchFilter, setMatchFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

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

  async function reopenBetting(matchId) {
    await supabase.from('matches').update({ betting_closed: false }).eq('id', matchId)
    fetchAll()
  }

  async function closeBetting(matchId) {
    await supabase.from('matches').update({ betting_closed: true }).eq('id', matchId)
    fetchAll()
  }

  async function handleSyncScores() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/update-scores')
      const data = await res.json()
      const u = data.updated || 0
      const c = data.created || 0
      setSyncMsg(u > 0 || c > 0
        ? `Sincronizado: ${u} actualizado(s)${c > 0 ? `, ${c} nuevo(s)` : ''}`
        : 'Sin cambios — los marcadores ya estan al dia'
      )
      fetchAll()
    } catch {
      setSyncMsg('Error al conectar con la API de marcadores')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 5000)
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Panel de Administracion</h1>
            <p className="page-subtitle">Control total del sistema — {profile?.username}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleSyncScores}
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <WorldIcon size={15} style={syncing ? { animation: 'spin 1s linear infinite' } : {}} />
              {syncing ? 'Sincronizando...' : 'Actualizar marcadores ESPN'}
            </button>
            {syncMsg && (
              <span style={{ fontSize: '0.75rem', color: syncMsg.startsWith('Error') ? 'var(--red)' : 'var(--green)' }}>
                {syncMsg}
              </span>
            )}
          </div>
        </div>
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
                    <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Partidos ({matches.length})</h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn btn-gold btn-sm" onClick={() => setShowCreateMatch(true)}>
                        <PlusIcon size={15} /> Nuevo partido
                      </button>
                      <select className="form-input" style={{ width: 'auto', fontSize: '0.78rem', padding: '5px 10px' }}
                        value={matchFilter} onChange={e => setMatchFilter(e.target.value)}>
                        <option value="all">Todos</option>
                        <option value="upcoming">Proximos</option>
                        <option value="live">En vivo</option>
                        <option value="finished">Finalizados</option>
                      </select>
                    </div>
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
                                <span className={`fi fi-${m.team1_code}`} style={{ width: 18, height: 13, backgroundSize: 'cover', borderRadius: 2, display: 'inline-block' }} />
                                {m.team1}
                                <span style={{ color: 'var(--text-3)' }}>vs</span>
                                <span className={`fi fi-${m.team2_code}`} style={{ width: 18, height: 13, backgroundSize: 'cover', borderRadius: 2, display: 'inline-block' }} />
                                {m.team2}
                              </span>
                            </td>
                            <td><span className="badge badge-group">{m.group_name || '—'}</span></td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(m.match_datetime)}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <span className={`badge badge-${m.status}`}>
                                  {m.status === 'upcoming' ? 'Proximo' : m.status === 'live' ? 'En vivo' : 'Finalizado'}
                                </span>
                                {m.betting_closed && (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--red)', fontWeight: 600 }}>apuestas cerradas</span>
                                )}
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                              {m.status === 'finished' ? `${m.team1_score} - ${m.team2_score}` : '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {m.status === 'upcoming' && !m.betting_closed && (
                                  <button className="btn btn-sm btn-outline" onClick={() => setMatchLive(m.id)}>
                                    En vivo
                                  </button>
                                )}
                                {m.betting_closed ? (
                                  <button className="btn btn-sm btn-outline"
                                    style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,0.35)' }}
                                    onClick={() => reopenBetting(m.id)}>
                                    Reabrir apuestas
                                  </button>
                                ) : (
                                  <button className="btn btn-sm btn-outline"
                                    style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.35)' }}
                                    onClick={() => closeBetting(m.id)}>
                                    Cerrar apuestas
                                  </button>
                                )}
                                {m.status !== 'finished' && (
                                  <button className="btn btn-sm btn-gold" onClick={() => setResultModal(m)}>
                                    Resultado
                                  </button>
                                )}
                                {m.status === 'finished' && (
                                  <button className="btn btn-sm btn-outline" onClick={() => setResultModal(m)}>
                                    Corregir
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
                    <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Usuarios ({users.length})</h2>
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
                          <th>Apuestas</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => {
                          const userBetsCount = bets.filter(b => b.user_id === u.id).length
                          const pendingCount = bets.filter(b => b.user_id === u.id && b.status === 'pending').length
                          return (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'var(--gold-glow)', border: '1px solid rgba(240,180,41,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0
                                  }}>
                                    {u.username[0].toUpperCase()}
                                  </div>
                                  {u.username}
                                </div>
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>{u.email}</td>
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
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                                {userBetsCount} total{pendingCount > 0 && <span style={{ color: 'var(--orange)', marginLeft: 4 }}>({pendingCount} pendiente{pendingCount > 1 ? 's' : ''})</span>}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline"
                                  style={{ color: 'var(--gold)', borderColor: 'rgba(240,180,41,0.35)', whiteSpace: 'nowrap' }}
                                  onClick={() => setAdjustModal(u)}
                                >
                                  <ChipIcon size={13} /> Ajustar fichas
                                </button>
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
      {showCreateMatch && (
        <CreateMatchModal onClose={() => setShowCreateMatch(false)} onSuccess={fetchAll} />
      )}
      {resultModal && (
        <SetResultModal match={resultModal} onClose={() => setResultModal(null)} onSuccess={fetchAll} />
      )}
      {adjustModal && (
        <AdjustBalanceModal
          user={adjustModal}
          matches={matches}
          onClose={() => setAdjustModal(null)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  )
}
