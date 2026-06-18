import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  ChipIcon, ArrowUpIcon, ArrowDownIcon, TrophyIcon, BallIcon,
  LoanIcon, AlertIcon, CheckIcon,
} from '../assets/Icons'

const TX_LABELS = {
  initial_deposit: 'Deposito inicial',
  bet_placed: 'Apuesta colocada',
  bet_won: 'Apuesta ganada',
  bet_lost: 'Apuesta perdida',
  admin_adjustment: 'Ajuste administrativo',
  loan_received: 'Prestamo recibido',
  loan_payment: 'Pago de prestamo',
}

const LOAN_TIERS = [
  { max: 10,  rate: 10,  label: '1–10' },
  { max: 20,  rate: 20,  label: '11–20' },
  { max: 30,  rate: 35,  label: '21–30' },
  { max: 40,  rate: 55,  label: '31–40' },
  { max: 50,  rate: 80,  label: '41–50' },
]

function getLoanRate(amount) {
  return LOAN_TIERS.find(t => amount <= t.max)?.rate ?? 80
}
function getTotalToPay(amount) {
  return Math.round(amount * (1 + getLoanRate(amount) / 100) * 100) / 100
}
function getActiveTier(amount) {
  return LOAN_TIERS.findIndex(t => amount <= t.max)
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
  if (tx.type === 'loan_received') { iconClass = 'credit'; amountClass = 'credit'; Icon = LoanIcon }
  if (tx.type === 'loan_payment') { iconClass = 'debit'; amountClass = 'debit'; Icon = LoanIcon }

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

function LoanSection({ balance, activeLoan, onLoanTaken, onLoanPaid }) {
  const [loanAmount, setLoanAmount] = useState(10)
  const [payAmount, setPayAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const rate = getLoanRate(loanAmount)
  const total = getTotalToPay(loanAmount)
  const activeTierIdx = getActiveTier(loanAmount)

  async function handleRequestLoan() {
    setLoading(true)
    setMsg(null)
    const { data, error } = await supabase.rpc('request_loan', { p_amount: loanAmount })
    setLoading(false)
    if (error || !data?.success) {
      setMsg({ type: 'error', text: data?.error || error?.message || 'Error al procesar' })
    } else {
      setMsg({ type: 'ok', text: `Prestamo aprobado. +${loanAmount} FCH en tu cuenta.` })
      onLoanTaken()
    }
  }

  async function handlePayLoan() {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return
    setLoading(true)
    setMsg(null)
    const { data, error } = await supabase.rpc('pay_loan', {
      p_loan_id: activeLoan.id,
      p_amount: amount,
    })
    setLoading(false)
    if (error || !data?.success) {
      setMsg({ type: 'error', text: data?.error || error?.message || 'Error al pagar' })
    } else {
      setPayAmount('')
      if (data.fully_paid) {
        setMsg({ type: 'ok', text: 'Prestamo saldado completamente. Bien jugado.' })
      } else {
        setMsg({ type: 'ok', text: `Pagaste ${amount} FCH. Quedan ${data.remaining} FCH.` })
      }
      onLoanPaid()
    }
  }

  if (activeLoan) {
    const remaining = activeLoan.total_to_pay - activeLoan.amount_paid
    const paidPct = Math.min(100, (activeLoan.amount_paid / activeLoan.total_to_pay) * 100)
    const maxPay = Math.min(balance, remaining)

    return (
      <div className="loan-alert-banner has-debt" style={{ marginBottom: 20 }}>
        <div className="loan-alert-top">
          <div className="loan-alert-icon danger">
            <AlertIcon size={18} />
          </div>
          <div>
            <p className="loan-alert-title">Deuda activa con La Casa</p>
            <p className="loan-alert-sub">
              Prestamo de {activeLoan.amount} FCH · {activeLoan.interest_rate}% interes
            </p>
          </div>
        </div>

        <div className="loan-debt-bar-wrap">
          <div className="loan-debt-label">
            <span>Pagado: {activeLoan.amount_paid.toFixed(0)} FCH</span>
            <span style={{ color: 'var(--red)', fontWeight: 700 }}>
              Deuda: {remaining.toFixed(0)} FCH
            </span>
          </div>
          <div className="loan-debt-bar-bg">
            <div className="loan-debt-bar-fill" style={{ width: `${paidPct}%` }} />
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 12 }}>
          Total a pagar: <strong style={{ color: 'var(--text-1)' }}>
            {activeLoan.total_to_pay} FCH
          </strong>
          {' '}· Tu balance actual: <strong style={{ color: 'var(--gold)' }}>
            {balance.toFixed(0)} FCH
          </strong>
        </div>

        {msg && (
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--r-sm)', marginBottom: 10,
            fontSize: '0.78rem', fontWeight: 600,
            background: msg.type === 'ok' ? 'var(--green-bg)' : 'var(--red-bg)',
            color: msg.type === 'ok' ? 'var(--green)' : 'var(--red)',
          }}>
            {msg.text}
          </div>
        )}

        <div className="loan-pay-row">
          <div className="loan-pay-input-wrap">
            <ChipIcon size={14} className="loan-pay-chip" />
            <input
              type="number"
              className="form-input"
              placeholder={`Max ${maxPay.toFixed(0)} FCH`}
              value={payAmount}
              min={1}
              max={maxPay}
              step={1}
              onChange={e => setPayAmount(e.target.value)}
            />
          </div>
          <button
            className="btn btn-gold"
            style={{ flexShrink: 0 }}
            onClick={handlePayLoan}
            disabled={loading || !payAmount || parseFloat(payAmount) <= 0 || balance <= 0}
          >
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : <><CheckIcon size={15} /> Pagar</>}
          </button>
          <button
            className="btn btn-outline btn-sm"
            style={{ flexShrink: 0 }}
            onClick={() => setPayAmount(maxPay.toFixed(0))}
            disabled={balance <= 0}
          >
            Todo
          </button>
        </div>
      </div>
    )
  }

  if (balance >= 10) return null

  return (
    <div className="loan-alert-banner" style={{ marginBottom: 20 }}>
      <div className="loan-alert-top">
        <div className="loan-alert-icon">
          <LoanIcon size={18} />
        </div>
        <div>
          <p className="loan-alert-title">Prestamista de emergencia</p>
          <p className="loan-alert-sub">
            Tienes {balance.toFixed(0)} FCH — La Casa puede ayudarte... con interes
          </p>
        </div>
      </div>

      <div className="loan-tiers" style={{ marginTop: 14 }}>
        {LOAN_TIERS.map((t, i) => (
          <div key={i} className={`loan-tier${i === activeTierIdx ? ' active-tier' : ''}`}>
            <div className="loan-tier-range">{t.label} FCH</div>
            <div className="loan-tier-rate">{t.rate}%</div>
          </div>
        ))}
      </div>

      <div className="loan-slider-wrap">
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 8,
        }}>
          <span>Monto a pedir</span>
          <span style={{ color: 'var(--orange)', fontWeight: 700 }}>
            {loanAmount} FCH
          </span>
        </div>
        <input
          type="range"
          className="loan-slider"
          min={1} max={50} step={1}
          value={loanAmount}
          onChange={e => setLoanAmount(Number(e.target.value))}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 4,
        }}>
          <span>1 FCH</span>
          <span>50 FCH</span>
        </div>
      </div>

      <div className="loan-preview">
        <div className="loan-preview-item">
          <div className="loan-preview-label">Recibes</div>
          <div className="loan-preview-val">{loanAmount}</div>
        </div>
        <div className="loan-preview-item">
          <div className="loan-preview-label">Interes</div>
          <div className="loan-preview-val orange">{rate}%</div>
        </div>
        <div className="loan-preview-item">
          <div className="loan-preview-label">Debes</div>
          <div className="loan-preview-val red">{total}</div>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--r-sm)', marginBottom: 10,
          fontSize: '0.78rem', fontWeight: 600,
          background: msg.type === 'ok' ? 'var(--green-bg)' : 'var(--red-bg)',
          color: msg.type === 'ok' ? 'var(--green)' : 'var(--red)',
        }}>
          {msg.text}
        </div>
      )}

      <button
        className="btn btn-block"
        style={{
          background: 'linear-gradient(135deg, #ea580c, #dc2626)',
          color: 'white', fontWeight: 700,
        }}
        onClick={handleRequestLoan}
        disabled={loading}
      >
        {loading
          ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          : <><LoanIcon size={16} /> Solicitar {loanAmount} FCH (pagar {total})</>}
      </button>
    </div>
  )
}

export default function BankPage() {
  const { profile, refreshProfile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [activeLoan, setActiveLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const balance = Number(profile?.chips_balance ?? 0)

  async function fetchData() {
    if (!profile?.id) return
    const [txRes, loanRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('loans')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1),
    ])
    setTransactions(txRes.data || [])
    setActiveLoan(loanRes.data?.[0] || null)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [profile?.id])

  async function handleLoanEvent() {
    await refreshProfile()
    await fetchData()
  }

  const stats = transactions.reduce((acc, tx) => {
    if (tx.type === 'bet_won') acc.ganadas++
    if (tx.type === 'bet_lost') acc.perdidas++
    if (tx.type === 'bet_placed') acc.apostado += Number(tx.amount) * -1
    if (tx.type === 'bet_won') acc.ganancia += Number(tx.amount)
    return acc
  }, { ganadas: 0, perdidas: 0, apostado: 0, ganancia: 0 })

  const netProfit = stats.ganancia - stats.apostado

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  const showLoanSection = balance < 10 || activeLoan !== null

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Banco de Fichas</h1>
        <p className="page-subtitle">Historial de transacciones y balance</p>
      </div>

      {showLoanSection && (
        <LoanSection
          balance={balance}
          activeLoan={activeLoan}
          onLoanTaken={handleLoanEvent}
          onLoanPaid={handleLoanEvent}
        />
      )}

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

          {activeLoan && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--r-md)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-3)' }}>Deuda pendiente</span>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                  {(activeLoan.total_to_pay - activeLoan.amount_paid).toFixed(0)} FCH
                </span>
              </div>
            </div>
          )}
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
              <option value="loan_received">Prestamos</option>
              <option value="loan_payment">Pagos</option>
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
