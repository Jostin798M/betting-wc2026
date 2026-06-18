import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/betting/MatchCard'
import BetModal from '../components/betting/BetModal'
import { BallIcon, FilterIcon } from '../assets/Icons'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const PHASES = [
  { key: 'group', label: 'Fase de grupos' },
  { key: 'round_of_32', label: 'Ronda de 32' },
  { key: 'round_of_16', label: 'Octavos' },
  { key: 'quarterfinal', label: 'Cuartos' },
  { key: 'semifinal', label: 'Semifinal' },
  { key: 'final', label: 'Final' },
]

function toEcuador(date) {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }))
}

function isToday(isoStr) {
  const now = toEcuador(new Date())
  const d = toEcuador(new Date(isoStr))
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

export default function BettingPage() {
  const { profile, refreshProfile } = useAuth()
  const [matches, setMatches] = useState([])
  const [userBets, setUserBets] = useState({})
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('today')
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [betModal, setBetModal] = useState(null)
  const [availablePhases, setAvailablePhases] = useState(['group'])

  const fetchData = useCallback(async () => {
    if (!profile?.id) return
    const [matchesRes, betsRes] = await Promise.all([
      supabase.from('matches').select('*').order('match_datetime', { ascending: true }),
      supabase.from('bets').select('*').eq('user_id', profile.id)
    ])

    if (matchesRes.data) {
      setMatches(matchesRes.data)
      const phases = [...new Set(matchesRes.data.map(m => m.phase))]
      setAvailablePhases(phases)
    }
    if (betsRes.data) {
      const map = {}
      for (const bet of betsRes.data) {
        if (!map[bet.match_id]) map[bet.match_id] = bet
      }
      setUserBets(map)
    }
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel('matches-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  const todayMatches = matches.filter(m => isToday(m.match_datetime))
  const liveMatches = matches.filter(m => m.status === 'live')
  const groupMatches = matches.filter(m => m.phase === 'group' && m.group_name === selectedGroup)
  const currentPhaseMatches = matches.filter(m => m.phase === view)

  function handleBet(match) { setBetModal(match) }
  function handleBetSuccess() { fetchData(); refreshProfile() }

  if (loading) return (
    <div className="page-content">
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <span className="text-muted">Cargando partidos...</span>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Casa de Apuestas</h1>
            <p className="page-subtitle">Mundial 2026 — USA, Canada & Mexico</p>
          </div>
          {liveMatches.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--orange-bg)', border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: 'var(--r-md)', padding: '8px 14px',
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--orange)'
            }}>
              <span className="live-dot" />
              {liveMatches.length} partido{liveMatches.length > 1 ? 's' : ''} en vivo
            </div>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="tabs">
        <button className={`tab-btn${view === 'today' ? ' active' : ''}`} onClick={() => setView('today')}>
          Hoy
        </button>
        <button className={`tab-btn${view === 'group' ? ' active' : ''}`} onClick={() => setView('group')}>
          Por grupo
        </button>
        {availablePhases.filter(p => p !== 'group').map(phase => {
          const ph = PHASES.find(p => p.key === phase)
          return ph ? (
            <button key={phase} className={`tab-btn${view === phase ? ' active' : ''}`} onClick={() => setView(phase)}>
              {ph.label}
            </button>
          ) : null
        })}
      </div>

      {/* Group selector */}
      {view === 'group' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {GROUPS.map(g => (
            <button
              key={g}
              className={`btn btn-sm${selectedGroup === g ? ' btn-gold' : ' btn-outline'}`}
              onClick={() => setSelectedGroup(g)}
            >
              Grupo {g}
            </button>
          ))}
        </div>
      )}

      {/* Match List */}
      {view === 'today' && (
        <>
          {todayMatches.length === 0 ? (
            <div className="empty-state">
              <BallIcon size={48} className="empty-state-icon" style={{ margin: '0 auto 12px', opacity: 0.2, color: 'var(--text-3)', display: 'block' }} />
              <p className="empty-state-text">No hay partidos programados para hoy</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 16 }}>
                <FilterIcon size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {todayMatches.length} partido{todayMatches.length !== 1 ? 's' : ''} hoy (hora Ecuador)
              </p>
              <div className="matches-grid">
                {todayMatches.map(m => (
                  <MatchCard key={m.id} match={m} userBet={userBets[m.id]} onBet={handleBet} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {view === 'group' && (
        <>
          <div className="matches-grid">
            {groupMatches.map(m => (
              <MatchCard key={m.id} match={m} userBet={userBets[m.id]} onBet={handleBet} />
            ))}
          </div>
          {groupMatches.length === 0 && (
            <div className="empty-state">
              <p className="empty-state-text">No hay partidos en el Grupo {selectedGroup}</p>
            </div>
          )}
          <GroupStandings group={selectedGroup} matches={matches} />
        </>
      )}

      {!['today','group'].includes(view) && (
        <div className="matches-grid">
          {currentPhaseMatches.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <p className="empty-state-text">Los partidos de esta fase aun no han sido generados</p>
            </div>
          ) : currentPhaseMatches.map(m => (
            <MatchCard key={m.id} match={m} userBet={userBets[m.id]} onBet={handleBet} />
          ))}
        </div>
      )}

      {betModal && (
        <BetModal
          match={betModal}
          onClose={() => setBetModal(null)}
          onSuccess={handleBetSuccess}
        />
      )}
    </div>
  )
}

function GroupStandings({ group, matches }) {
  const finished = matches.filter(m => m.phase === 'group' && m.group_name === group && m.status === 'finished')
  if (finished.length === 0) return null

  const teams = {}
  function ensure(name, code) {
    if (!teams[name]) teams[name] = { team: name, code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }
  }

  for (const m of finished) {
    ensure(m.team1, m.team1_code)
    ensure(m.team2, m.team2_code)
    teams[m.team1].p++; teams[m.team2].p++
    teams[m.team1].gf += m.team1_score; teams[m.team1].ga += m.team2_score
    teams[m.team2].gf += m.team2_score; teams[m.team2].ga += m.team1_score
    if (m.team1_score > m.team2_score) { teams[m.team1].w++; teams[m.team2].l++ }
    else if (m.team1_score < m.team2_score) { teams[m.team2].w++; teams[m.team1].l++ }
    else { teams[m.team1].d++; teams[m.team2].d++ }
  }

  const rows = Object.values(teams)
    .map(t => ({ ...t, pts: t.w * 3 + t.d, gd: t.gf - t.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

  return (
    <div className="card mt-4">
      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Tabla — Grupo {group}
      </p>
      <div className="standing-row" style={{ color: 'var(--text-3)', fontSize: '0.7rem', paddingTop: 0 }}>
        <span>#</span><span>Equipo</span>
        <span>PJ</span><span>PG</span><span>PE</span><span>PP</span><span>Pts</span>
      </div>
      {rows.map((t, i) => (
        <div key={t.team} className={`standing-row${i < 2 ? ' qualified' : ''}`}>
          <span className="standing-pos">{i + 1}</span>
          <div className="standing-team">
            <div className="standing-flag">
              <span className={`fi fi-${t.code}`} style={{ width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }} />
            </div>
            <span>{t.team}</span>
          </div>
          <span className="standing-stat">{t.p}</span>
          <span className="standing-stat">{t.w}</span>
          <span className="standing-stat">{t.d}</span>
          <span className="standing-stat">{t.l}</span>
          <span className="standing-pts">{t.pts}</span>
        </div>
      ))}
      <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 8 }}>
        Verde = clasifica a la siguiente ronda
      </p>
    </div>
  )
}
