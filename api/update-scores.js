import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

const STATUS_MAP = {
  STATUS_SCHEDULED: 'upcoming',
  STATUS_IN_PROGRESS: 'live',
  STATUS_FINAL: 'finished',
  STATUS_HALFTIME: 'live',
  STATUS_END_PERIOD: 'live',
}

function normalizeTeamName(name) {
  const map = {
    'Mexico': 'Mexico', 'South Africa': 'Sudafrica', 'Korea Republic': 'Corea del Sur',
    'Czech Republic': 'Republica Checa', 'Czechia': 'Republica Checa',
    'Canada': 'Canada', 'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
    'Switzerland': 'Suiza', 'Qatar': 'Qatar', 'Brazil': 'Brasil', 'Morocco': 'Marruecos',
    'Haiti': 'Haiti', 'Scotland': 'Escocia', 'United States': 'Estados Unidos',
    'USA': 'Estados Unidos', 'Paraguay': 'Paraguay', 'Australia': 'Australia',
    'Turkey': 'Turquia', 'Türkiye': 'Turquia', 'Germany': 'Alemania',
    'Curacao': 'Curacao', 'Ivory Coast': 'Costa de Marfil', "Cote d'Ivoire": 'Costa de Marfil',
    'Ecuador': 'Ecuador', 'Netherlands': 'Paises Bajos', 'Japan': 'Japon',
    'Sweden': 'Suecia', 'Tunisia': 'Tunez', 'Belgium': 'Belgica', 'Egypt': 'Egipto',
    'Iran': 'Iran', 'New Zealand': 'Nueva Zelanda', 'Spain': 'Espana',
    'Cape Verde': 'Cabo Verde', 'Saudi Arabia': 'Arabia Saudita', 'Uruguay': 'Uruguay',
    'France': 'Francia', 'Senegal': 'Senegal', 'Iraq': 'Irak', 'Norway': 'Noruega',
    'Argentina': 'Argentina', 'Algeria': 'Argelia', 'Austria': 'Austria', 'Jordan': 'Jordania',
    'Portugal': 'Portugal', 'DR Congo': 'RD Congo', 'Congo DR': 'RD Congo',
    'Uzbekistan': 'Uzbekistan', 'Colombia': 'Colombia', 'England': 'Inglaterra',
    'Croatia': 'Croacia', 'Ghana': 'Ghana', 'Panama': 'Panama',
  }
  return map[name] || name
}

export default async function handler(req, res) {
  try {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

    const espnRes = await fetch(`${ESPN_URL}?dates=${dateStr}`)
    const data = await espnRes.json()

    if (!data.events || data.events.length === 0) {
      return res.json({ message: 'No matches today', updated: 0 })
    }

    const { data: dbMatches } = await supabase
      .from('matches')
      .select('*')
      .gte('match_datetime', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
      .lte('match_datetime', new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString())

    let updated = 0

    for (const event of data.events) {
      const comp = event.competitions?.[0]
      if (!comp) continue

      const home = comp.competitors?.find(c => c.homeAway === 'home')
      const away = comp.competitors?.find(c => c.homeAway === 'away')
      if (!home || !away) continue

      const homeTeam = normalizeTeamName(home.team.displayName)
      const awayTeam = normalizeTeamName(away.team.displayName)
      const espnStatus = event.status?.type?.name || 'STATUS_SCHEDULED'
      const newStatus = STATUS_MAP[espnStatus] || 'upcoming'
      const homeScore = parseInt(home.score || '0', 10)
      const awayScore = parseInt(away.score || '0', 10)
      const espnId = event.id

      const dbMatch = dbMatches?.find(m =>
        (m.team1 === homeTeam && m.team2 === awayTeam) ||
        (m.team1 === awayTeam && m.team2 === homeTeam)
      )

      if (!dbMatch) continue

      const isReversed = dbMatch.team1 === awayTeam

      const updatePayload = {
        status: newStatus,
        team1_score: isReversed ? awayScore : homeScore,
        team2_score: isReversed ? homeScore : awayScore,
        espn_event_id: espnId,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === 'finished' || newStatus === 'live') {
        updatePayload.betting_closed = true
      }

      const wasFinished = dbMatch.status === 'finished'
      await supabase.from('matches').update(updatePayload).eq('id', dbMatch.id)

      if (newStatus === 'finished' && !wasFinished) {
        await supabase.rpc('settle_match_bets', {
          p_match_id: dbMatch.id,
          p_team1_score: updatePayload.team1_score,
          p_team2_score: updatePayload.team2_score,
        })
      }

      updated++
    }

    return res.json({ message: 'Scores updated', updated })
  } catch (err) {
    console.error('update-scores error:', err)
    return res.status(500).json({ error: err.message })
  }
}
