import { ClockIcon, StadiumIcon } from '../../assets/Icons'

const BET_TYPE_LABELS = {
  team1_win: 'Gana equipo local',
  draw: 'Empate',
  team2_win: 'Gana equipo visitante',
}

function Flag({ code, size = 40 }) {
  return (
    <div className="match-team-flag" style={{ width: size, height: Math.round(size * 0.7) }}>
      <span
        className={`fi fi-${code}`}
        style={{ width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}
      />
    </div>
  )
}

function formatDateEC(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTimeEC(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('es-EC', {
    timeZone: 'America/Guayaquil',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MatchCard({ match, userBet, onBet }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const canBet = !match.betting_closed

  const PHASE_LABELS = {
    group: `Grupo ${match.group_name}`,
    round_of_32: 'Ronda de 32',
    round_of_16: 'Octavos de final',
    quarterfinal: 'Cuartos de final',
    semifinal: 'Semifinal',
    third_place: 'Tercer puesto',
    final: 'Final',
  }
  const phaseLabel = PHASE_LABELS[match.phase] ?? match.phase

  return (
    <div className={`match-card${isLive ? ' live' : ''}${isFinished ? ' finished' : ''}`}>
      {/* Header */}
      <div className="match-card-header">
        <span className="match-group-badge">{phaseLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLive && (
            <span className="badge badge-live">
              <span className="live-dot" /> En vivo
            </span>
          )}
          {isFinished && <span className="badge badge-finished">Finalizado</span>}
          {!isLive && !isFinished && <span className="badge badge-upcoming">Proximo</span>}
        </div>
      </div>

      {/* Teams */}
      <div className="match-teams">
        <div className="match-team">
          <Flag code={match.team1_code} />
          <span className="match-team-name">{match.team1}</span>
        </div>

        <div className="match-score-center">
          {(isLive || isFinished) ? (
            <span className="match-score">
              <span>{match.team1_score}</span>
              <span className="match-score-sep" style={{ fontSize: '1rem', margin: '0 4px' }}>-</span>
              <span>{match.team2_score}</span>
            </span>
          ) : (
            <span className="match-vs">VS</span>
          )}
          {isLive && <span className="match-time-label">En curso</span>}
        </div>

        <div className="match-team">
          <Flag code={match.team2_code} />
          <span className="match-team-name">{match.team2}</span>
        </div>
      </div>

      {/* Info */}
      <div className="match-info">
        <span className="match-info-item">
          <ClockIcon size={12} />
          {isFinished || isLive ? formatDateEC(match.match_datetime) : formatDateEC(match.match_datetime)}
        </span>
        {match.city && (
          <span className="match-info-item">
            <StadiumIcon size={12} /> {match.city}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="match-actions">
        {canBet && !userBet && (
          <button className="btn btn-gold btn-sm btn-block" onClick={() => onBet(match)}>
            Apostar
          </button>
        )}

        {userBet && (
          <div className="user-bet-info">
            <span className="user-bet-label">Tu apuesta:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="user-bet-detail">
                {BET_TYPE_LABELS[userBet.bet_type]} — {Number(userBet.amount).toFixed(0)} fichas
              </span>
              {userBet.status !== 'pending' && (
                <span className={`badge badge-${userBet.status}`}>
                  {userBet.status === 'won' ? 'Ganada' : 'Perdida'}
                </span>
              )}
            </div>
          </div>
        )}

        {isFinished && !userBet && (
          <div className="empty-state" style={{ padding: '8px 0' }}>
            <span className="text-xs text-muted">Sin apuesta en este partido</span>
          </div>
        )}

        {!canBet && !isFinished && !userBet && match.status === 'upcoming' && (
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)' }}>
            Apuestas cerradas
          </div>
        )}
      </div>
    </div>
  )
}
