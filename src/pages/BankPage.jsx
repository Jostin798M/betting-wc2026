import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChipIcon, ArrowUpIcon, ArrowDownIcon, TrophyIcon, BallIcon } from '../assets/Icons'

const TX_LABELS = {
  initial_deposit: 'Deposito inicial',
  bet_placed: 'Apuesta colocada',
  bet_won: 'Apuesta ganada',
  bet_lost: 'Apuesta perdida',
  admin_adjustment: 'Ajuste administrativo',
}

function formatDateFull(isoStr) {
  return new Date(isoStr).toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function TxRow({ tx }) {
  const isCredit = tx.amount > 0
  const isNeutral = tx.amount === 0

  let iconClass = 'neutral'
  let amountClass = 'neutral'
  let prefix = ''
  let Icon = BallIcon

  if (isCredit) { iconClass = 'credit'; amountClass = 'credit'; prefix = '+'; Icon = ArrowUpIcon }
  else if (!isNeutral) { iconClass = 'debit'; amountClass = 'debit'; prefix = ''; Icon = ArrowDownIcon }

  if (tx.type === 'bet_lost') { iconClass = 'debit'; amountClass = 'debit'; Icon = ArrowDownIcon }
  if (tx.type === 'bet_won') { Icon = TrophyIcon }
  if (tx.type === 'initial_deposit') { Icon = ChipIcon }

  return (
    <div className="tx-row">
      <div className={`tx-icon-wrap ${iconClass}`}>
        <Icon size={14} />
      </div>
      <div className="tx-main">
        <p className="tx-desc">{TX_LABELS[tx.type] || tx.type}</p>
        {tx.match_info && <p className="tx-date">{tx.match_info}</p>}
        <p className="tx-date">{formatDateFull(tx.created_at)}</p>
      </div>
      <div className="tx-right">
        <p className={`tx-amount ${amountClass}`}>
          {tx.type === 'bet_lost'
            ? <span style={{ fontSize: '0.75rem' }}>Perdida</span>
            : `${prefix}${Math.abs(tx.amount).toFixed(0)}`
          }
        </p>
        <p className="tx-balance">{Number(tx.balance_after).toFixed(0)} fichas</p>
      </div>
    </div>
  )
}

export default function BankPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTransactions(data || [])
        setLoading(false)
      })
  }, [profile?.id])

  const balance = Number(profile?.chips_balance ?? 0)

  const stats = transactions.reduce((acc, tx) => {
    if (tx.type === 'bet_won') acc.ganadas++
    if (tx.type === 'bet_lost') acc.perdidas++
    if (tx.type === 'bet_placed') acc.apostado += Number(tx.amount) * -1
    if (tx.type === 'bet_won') acc.ganancia += Number(tx.amount)
    return acc
  }, { ganadas: 0, perdidas: 0, apostado: 0, ganancia: 0 })

  const netProfit = stats.ganancia - stats.apostado

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Banco de Fichas</h1>
        <p className="page-subtitle">Historial de transacciones y balance</p>
      </div>

      <div className="bank-grid">
        {/* Balance Card */}
        <div className="bank-balance-card">
          <p className="bank-balance-label">BALANCE DISPONIBLE</p>
          <div className="bank-balance-amount">
            {balance.toFixed(0)}
            <span className="bank-balance-unit"> FCH</span>
          </div>
          <p className="bank-balance-name">Mundial Bet 2026 — {profile?.username}</p>

          <div className="bank-stats">
            <div className="bank-stat">
              <p className="bank-stat-label">Apuestas ganadas</p>
              <p className="bank-stat-value green">{stats.ganadas}</p>
            </div>
            <div className="bank-stat">
              <p className="bank-stat-label">Apuestas perdidas</p>
              <p className="bank-stat-value red">{stats.perdidas}</p>
            </div>
            <div className="bank-stat">
              <p className="bank-stat-label">Balance neto</p>
              <p className={`bank-stat-value ${netProfit >= 0 ? 'green' : 'red'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(0)}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(240,180,41,0.08)', borderRadius: 'var(--r-md)', border: '1px solid rgba(240,180,41,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-3)' }}>
              <span>Total apostado</span>
              <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{stats.apostado.toFixed(0)} FCH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 6 }}>
              <span>Total ganado</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{stats.ganancia.toFixed(0)} FCH</span>
            </div>
            <div style={{ height: 1, background: 'rgba(240,180,41,0.1)', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
              <span style={{ color: 'var(--gold)' }}>Rendimiento</span>
              <span style={{ color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(0)} FCH
              </span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="card transactions-card">
          <div className="transactions-header">
            <h2 className="transactions-title">Movimientos</h2>
            <select
              className="form-input"
              style={{ width: 'auto', fontSize: '0.78rem', padding: '5px 10px' }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="bet_placed">Apuestas</option>
              <option value="bet_won">Ganadas</option>
              <option value="bet_lost">Perdidas</option>
            </select>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <ChipIcon size={48} className="empty-state-icon" style={{ margin: '0 auto 12px', opacity: 0.2, color: 'var(--text-3)', display: 'block' }} />
              <p className="empty-state-text">Sin movimientos todavia</p>
            </div>
          ) : (
            <div className="transactions-list">
              {filtered.map(tx => <TxRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
