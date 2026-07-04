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

// Detecta "equipos" que en realidad son slots del bracket aun sin definir,
// p.ej. "Round of 32 3 Winner", "Winner Group A", "Loser QF1", "TBD".
// No queremos crear partidos con estos placeholders.
function isPlaceholderTeam(name) {
  if (!name || !name.trim()) return true
  return /\b(winner|loser|runner|tbd)\b|round of \d|to be determined/i.test(name)
}

// ISO 3166-1 alpha-2 code -> usado por flag-icons (fi fi-xx).
// Solo se usa como respaldo si el equipo aun no existe en la BD.
function flagFromEspn(competitor) {
  const abbr = competitor?.team?.abbreviation
  // ESPN usa codigos de 2 letras minusculas en su href de bandera cuando esta disponible.
  const flagHref = competitor?.team?.flag?.href || ''
  const m = flagHref.match(/\/([a-z]{2})\.png/i)
  if (m) return m[1].toLowerCase()
  return (abbr || 'un').slice(0, 2).toLowerCase()
}

// Detecta la fase y (si aplica) el grupo a partir de los metadatos del evento ESPN.
// El scoreboard de la Copa del Mundo expone la ronda en competition.notes[].headline,
// p.ej. "Group A", "Round of 32", "Round of 16", "Quarterfinals", "Semifinals",
// "Third Place", "Final".
function detectPhaseAndGroup(comp) {
  const notes = comp?.notes || []
  const headline = (notes.map(n => n?.headline).filter(Boolean).join(' ') || '').toLowerCase()

  const groupMatch = headline.match(/group\s+([a-l])\b/)
  if (groupMatch) return { phase: 'group', group_name: groupMatch[1].toUpperCase() }

  // El orden importa: "quarterfinal"/"semifinal" contienen "final".
  if (headline.includes('round of 32')) return { phase: 'round_of_32', group_name: null }
  if (headline.includes('round of 16')) return { phase: 'round_of_16', group_name: null }
  if (headline.includes('quarter')) return { phase: 'quarterfinal', group_name: null }
  if (headline.includes('semi')) return { phase: 'semifinal', group_name: null }
  if (headline.includes('third') || headline.includes('3rd')) return { phase: 'third_place', group_name: null }
  if (headline.includes('final')) return { phase: 'final', group_name: null }

  return { phase: 'group', group_name: null }
}

export default async function handler(req, res) {
  try {
    const today = new Date()
    const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '')
    // Rango: desde ayer hasta +14 dias, para crear con antelacion los partidos
    // de la siguiente fase y mantener al dia los marcadores recientes.
    const start = new Date(today); start.setDate(start.getDate() - 1)
    const end = new Date(today); end.setDate(end.getDate() + 14)
    const dateRange = `${fmt(start)}-${fmt(end)}`

    const espnRes = await fetch(`${ESPN_URL}?dates=${dateRange}`)
    const data = await espnRes.json()

    if (!data.events || data.events.length === 0) {
      return res.json({ message: 'No matches in range', updated: 0, created: 0 })
    }

    // Traemos TODOS los partidos para poder: (1) encontrar coincidencias por
    // espn_event_id o por nombres, y (2) reutilizar los codigos de bandera ya
    // conocidos (los equipos de eliminatorias provienen de la fase de grupos).
    const { data: dbMatches } = await supabase.from('matches').select('*')
    const allMatches = dbMatches || []

    const byEspnId = new Map()
    const codeByName = new Map()
    for (const m of allMatches) {
      if (m.espn_event_id) byEspnId.set(String(m.espn_event_id), m)
      if (m.team1 && m.team1_code) codeByName.set(m.team1, m.team1_code)
      if (m.team2 && m.team2_code) codeByName.set(m.team2, m.team2_code)
    }

    let updated = 0
    let created = 0

    for (const event of data.events) {
      const comp = event.competitions?.[0]
      if (!comp) continue

      const home = comp.competitors?.find(c => c.homeAway === 'home')
      const away = comp.competitors?.find(c => c.homeAway === 'away')
      if (!home || !away) continue

      // Ignorar fixtures con equipos aun sin definir (slots del bracket).
      if (isPlaceholderTeam(home.team.displayName) || isPlaceholderTeam(away.team.displayName)) continue

      const homeTeam = normalizeTeamName(home.team.displayName)
      const awayTeam = normalizeTeamName(away.team.displayName)
      const espnStatus = event.status?.type?.name || 'STATUS_SCHEDULED'
      const newStatus = STATUS_MAP[espnStatus] || 'upcoming'
      const homeScore = parseInt(home.score || '0', 10)
      const awayScore = parseInt(away.score || '0', 10)
      const espnId = String(event.id)

      // 1) Coincidencia por espn_event_id; 2) por nombres de equipos.
      let dbMatch = byEspnId.get(espnId)
      if (!dbMatch) {
        dbMatch = allMatches.find(m =>
          (m.team1 === homeTeam && m.team2 === awayTeam) ||
          (m.team1 === awayTeam && m.team2 === homeTeam)
        )
      }

      // ---- CREAR partido nuevo (p.ej. fases eliminatorias aun no sembradas) ----
      if (!dbMatch) {
        const { phase, group_name } = detectPhaseAndGroup(comp)
        const isLiveOrDone = newStatus === 'finished' || newStatus === 'live'
        const insertPayload = {
          espn_event_id: espnId,
          phase,
          group_name,
          team1: homeTeam,
          team2: awayTeam,
          team1_code: codeByName.get(homeTeam) || flagFromEspn(home),
          team2_code: codeByName.get(awayTeam) || flagFromEspn(away),
          stadium: comp.venue?.fullName || null,
          city: comp.venue?.address?.city || null,
          match_datetime: event.date || new Date().toISOString(),
          status: newStatus,
          team1_score: homeScore,
          team2_score: awayScore,
          betting_closed: isLiveOrDone,
        }
        const { data: inserted, error: insErr } = await supabase
          .from('matches').insert(insertPayload).select().single()
        if (insErr) {
          console.error('insert match error:', insErr.message)
          continue
        }
        // Si el partido ya estaba finalizado al crearlo, liquidamos sus apuestas
        // (normalmente no habra ninguna, pero mantiene consistencia).
        if (newStatus === 'finished' && inserted) {
          await supabase.rpc('settle_match_bets', {
            p_match_id: inserted.id,
            p_team1_score: homeScore,
            p_team2_score: awayScore,
          })
        }
        created++
        continue
      }

      // ---- ACTUALIZAR partido existente ----
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

    return res.json({ message: 'Scores synced', updated, created })
  } catch (err) {
    console.error('update-scores error:', err)
    return res.status(500).json({ error: err.message })
  }
}
