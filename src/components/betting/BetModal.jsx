import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { XIcon, ChipIcon, CheckIcon } from '../../assets/Icons'

const BET_LABELS = {
  team1_win: 'Gana',
  draw: 'Empate',
  team2_win: 'Gana',
}

export default function BetModal({ match, onClose, onSuccess }) {
  const { profile, refreshProfile } = useAuth()
  const [betType, setBetType] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const balance = Number(profile?.chips_balance ?? 0)
  const numAmount = parseFloat(amount) || 0
  const potentialWin = numAmount * 2
  const valid = betType && numAmount > 0 && numAmount <= balance

  function whyDisabled() {
    if (!betType) return 'Selecciona una prediccion'
    if (numAmount <= 0) return 'Ingresa el monto a apostar'
    if (numAmount > balance) return 'Monto supera tu balance'
    return null
  }
  const disabledReason = whyDisabled()

  function setQuick(val) {
    if (val === 'all') setAmount(String(Math.floor(balance)))
    else setAmount(String(Math.min(val, Math.floor(balance))))
  }

  async function handleConfirm() {
    if (!valid) return
    setLoading(true)
    setError('')
    const { data, error: rpcErr } = await supabase.rpc('place_bet', {
      p_match_id: match.id,
      p_bet_type: betType,
      p_amount: numAmount,
    })
    setLoading(false)
    if (rpcErr || !data?.success) {
      setError(data?.error || rpcErr?.message || 'Error al procesar la apuesta')
      return
    }
    await refreshProfile()
    setDone(true)
    setTimeout(() => { onSuccess?.(); onClose() }, 1500)
  }

  const flagStyle = (code) => ({
    width: '100%', height: '100%',
    backgroundSize: 'cover', backgroundPosition: 'center',
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Realizar apuesta</span>
          <button className="modal-close" onClick={onClose}><XIcon size={20} /></button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--green-bg)', border: '2px solid var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: 'var(--green)'
            }}>
              <CheckIcon size={28} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--green)' }}>Apuesta registrada</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 4 }}>
              {numAmount} fichas apostadas — ganarías {potentialWin}
            </p>
          </div>
        ) : (
          <>
            {/* Teams */}
            <div className="modal-teams">
              <div className="modal-team">
                <div className="modal-team-flag">
                  <span className={`fi fi-${match.team1_code}`} style={flagStyle(match.team1_code)} />
                </div>
                <span className="modal-team-name">{match.team1}</span>
              </div>
              <span className="modal-vs">VS</span>
              <div className="modal-team">
                <div className="modal-team-flag">
                  <span className={`fi fi-${match.team2_code}`} style={flagStyle(match.team2_code)} />
                </div>
                <span className="modal-team-name">{match.team2}</span>
              </div>
            </div>

            {/* Bet Type */}
            <div className="modal-bet-type">
              <p className="modal-section-label">Elige tu prediccion</p>
              <div className="modal-bet-options">
                {['team1_win', 'draw', 'team2_win'].map(type => (
                  <button
                    key={type}
                    className={`modal-bet-opt${betType === type ? ' active' : ''}`}
                    onClick={() => setBetType(type)}
                  >
                    <span className="modal-bet-opt-label">{BET_LABELS[type]}</span>
                    <span className="modal-bet-opt-team">
                      {type === 'draw' ? 'Empate' : type === 'team1_win' ? match.team1 : match.team2}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 800 }}>x2</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="modal-amount">
              <p className="modal-section-label">Fichas a apostar (balance: {balance.toFixed(0)})</p>
              <div className="amount-quick">
                {[10, 25, 50, 100].map(v => (
                  <button key={v} className="amount-quick-btn" onClick={() => setQuick(v)}>{v}</button>
                ))}
                <button className="amount-quick-btn" onClick={() => setQuick('all')}>Todo</button>
              </div>
              <div className="amount-input-wrap">
                <ChipIcon size={16} className="amount-chip-icon" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)' }} />
                <input
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: 36, fontSize: '1rem', fontWeight: 700 }}
                  placeholder="0"
                  min="1"
                  max={balance}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              {numAmount > balance && (
                <p className="form-error" style={{ marginTop: 4 }}>Supera tu balance disponible</p>
              )}
            </div>

            {/* Summary */}
            {numAmount > 0 && betType && (
              <div className="modal-summary">
                <div className="modal-summary-row">
                  <span className="modal-summary-label">Apuesta</span>
                  <span className="modal-summary-val">{numAmount.toFixed(0)} fichas</span>
                </div>
                <div className="modal-summary-row">
                  <span className="modal-summary-label">Multiplicador</span>
                  <span className="modal-summary-val">x2</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                <div className="modal-summary-row">
                  <span className="modal-summary-label">Premio si aciertas</span>
                  <span className="modal-summary-win">+{potentialWin.toFixed(0)} fichas</span>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 12, fontSize: '0.82rem', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <div className="modal-footer" style={{ flexDirection: 'column', gap: 8 }}>
              {disabledReason && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>
                  {disabledReason}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button className="btn btn-outline btn-block" onClick={onClose}>Cancelar</button>
                <button
                  className="btn btn-gold btn-block"
                  onClick={handleConfirm}
                  disabled={!valid || loading}
                >
                  {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Procesando</> : 'Confirmar apuesta'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
