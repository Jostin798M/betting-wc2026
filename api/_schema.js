// SQL schema embedded for the auto-setup endpoint

export const SCHEMA_STATEMENTS = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

  `CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
    chips_balance NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    espn_event_id TEXT,
    group_name TEXT,
    phase TEXT NOT NULL DEFAULT 'group' CHECK (phase IN ('group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final')),
    team1 TEXT NOT NULL,
    team2 TEXT NOT NULL,
    team1_code TEXT NOT NULL DEFAULT 'un',
    team2_code TEXT NOT NULL DEFAULT 'un',
    stadium TEXT,
    city TEXT,
    match_datetime TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','finished','cancelled')),
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    betting_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    bet_type TEXT NOT NULL CHECK (bet_type IN ('team1_win','draw','team2_win')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','won','lost','cancelled')),
    potential_win NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('initial_deposit','bet_placed','bet_won','bet_lost','admin_adjustment')),
    description TEXT NOT NULL,
    balance_after NUMERIC(10,2) NOT NULL,
    related_bet_id UUID REFERENCES bets(id),
    match_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
]

export const RLS_STATEMENTS = [
  `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE matches ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE bets ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY`,

  // Funcion SECURITY DEFINER para chequear admin sin causar recursion en RLS
  `CREATE OR REPLACE FUNCTION is_admin()
  RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  $$`,

  // Profiles: cada usuario ve solo su propio perfil; admin ve todos (via funcion sin recursion)
  `DROP POLICY IF EXISTS "profiles_select_own" ON profiles`,
  `CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR is_admin())`,
  `DROP POLICY IF EXISTS "profiles_insert_own" ON profiles`,
  `CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`,
  `DROP POLICY IF EXISTS "profiles_update_own" ON profiles`,
  `CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin())`,
  `DROP POLICY IF EXISTS "profiles_select_admin" ON profiles`,

  // Matches: todos los autenticados pueden leer
  `DROP POLICY IF EXISTS "matches_select_all" ON matches`,
  `CREATE POLICY "matches_select_all" ON matches FOR SELECT TO authenticated USING (TRUE)`,
  `DROP POLICY IF EXISTS "matches_all_admin" ON matches`,
  `CREATE POLICY "matches_all_admin" ON matches FOR ALL TO authenticated USING (is_admin())`,

  // Bets: cada usuario ve las suyas; admin ve todas
  `DROP POLICY IF EXISTS "bets_select_own" ON bets`,
  `CREATE POLICY "bets_select_own" ON bets FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin())`,
  `DROP POLICY IF EXISTS "bets_all_admin" ON bets`,
  `CREATE POLICY "bets_all_admin" ON bets FOR ALL TO authenticated USING (is_admin())`,

  // Transactions: cada usuario ve las suyas; admin ve todas
  `DROP POLICY IF EXISTS "transactions_select_own" ON transactions`,
  `CREATE POLICY "transactions_select_own" ON transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin())`,
  `DROP POLICY IF EXISTS "transactions_all_admin" ON transactions`,
  `CREATE POLICY "transactions_all_admin" ON transactions FOR ALL TO authenticated USING (is_admin())`,
]

export const FUNCTION_STATEMENTS = [
  `CREATE OR REPLACE FUNCTION place_bet(
    p_match_id UUID,
    p_bet_type TEXT,
    p_amount NUMERIC
  ) RETURNS JSON AS $$
  DECLARE
    v_user_id UUID := auth.uid();
    v_balance NUMERIC;
    v_match RECORD;
    v_bet_id UUID;
    v_new_balance NUMERIC;
  BEGIN
    SELECT chips_balance INTO v_balance FROM profiles WHERE id = v_user_id FOR UPDATE;
    IF v_balance IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    IF v_balance < p_amount THEN
      RETURN json_build_object('success', false, 'error', 'Balance insuficiente');
    END IF;
    SELECT * INTO v_match FROM matches WHERE id = p_match_id;
    IF v_match IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Partido no encontrado');
    END IF;
    IF v_match.betting_closed THEN
      RETURN json_build_object('success', false, 'error', 'Las apuestas para este partido estan cerradas');
    END IF;
    v_new_balance := v_balance - p_amount;
    INSERT INTO bets (user_id, match_id, bet_type, amount, potential_win)
    VALUES (v_user_id, p_match_id, p_bet_type, p_amount, p_amount * 2)
    RETURNING id INTO v_bet_id;
    UPDATE profiles SET chips_balance = v_new_balance, updated_at = NOW() WHERE id = v_user_id;
    INSERT INTO transactions (user_id, amount, type, description, balance_after, related_bet_id, match_info)
    VALUES (v_user_id, -p_amount, 'bet_placed',
      'Apuesta: ' || v_match.team1 || ' vs ' || v_match.team2,
      v_new_balance, v_bet_id, v_match.team1 || ' vs ' || v_match.team2);
    RETURN json_build_object('success', true, 'bet_id', v_bet_id, 'new_balance', v_new_balance);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER`,

  `CREATE OR REPLACE FUNCTION settle_match_bets(
    p_match_id UUID,
    p_team1_score INTEGER,
    p_team2_score INTEGER
  ) RETURNS JSON AS $$
  DECLARE
    v_result TEXT;
    v_bet RECORD;
    v_user_balance NUMERIC;
    v_new_balance NUMERIC;
    v_won INTEGER := 0;
    v_lost INTEGER := 0;
  BEGIN
    IF p_team1_score > p_team2_score THEN v_result := 'team1_win';
    ELSIF p_team1_score < p_team2_score THEN v_result := 'team2_win';
    ELSE v_result := 'draw';
    END IF;
    UPDATE matches
    SET status = 'finished', team1_score = p_team1_score, team2_score = p_team2_score,
        betting_closed = TRUE, updated_at = NOW()
    WHERE id = p_match_id;
    FOR v_bet IN
      SELECT b.*, m.team1, m.team2
      FROM bets b JOIN matches m ON b.match_id = m.id
      WHERE b.match_id = p_match_id AND b.status = 'pending'
    LOOP
      SELECT chips_balance INTO v_user_balance FROM profiles WHERE id = v_bet.user_id FOR UPDATE;
      IF v_bet.bet_type = v_result THEN
        v_new_balance := v_user_balance + (v_bet.amount * 2);
        UPDATE bets SET status = 'won', settled_at = NOW() WHERE id = v_bet.id;
        UPDATE profiles SET chips_balance = v_new_balance, updated_at = NOW() WHERE id = v_bet.user_id;
        INSERT INTO transactions (user_id, amount, type, description, balance_after, related_bet_id, match_info)
        VALUES (v_bet.user_id, v_bet.amount * 2, 'bet_won',
          'Apuesta ganada: ' || v_bet.team1 || ' vs ' || v_bet.team2,
          v_new_balance, v_bet.id, v_bet.team1 || ' vs ' || v_bet.team2);
        v_won := v_won + 1;
      ELSE
        UPDATE bets SET status = 'lost', settled_at = NOW() WHERE id = v_bet.id;
        INSERT INTO transactions (user_id, amount, type, description, balance_after, related_bet_id, match_info)
        VALUES (v_bet.user_id, 0, 'bet_lost',
          'Apuesta perdida: ' || v_bet.team1 || ' vs ' || v_bet.team2,
          v_user_balance, v_bet.id, v_bet.team1 || ' vs ' || v_bet.team2);
        v_lost := v_lost + 1;
      END IF;
    END LOOP;
    RETURN json_build_object('success', true, 'won', v_won, 'lost', v_lost, 'result', v_result);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER`,

  `CREATE OR REPLACE FUNCTION get_group_standings(p_group TEXT)
  RETURNS TABLE (
    team TEXT, team_code TEXT,
    played INT, won INT, drawn INT, lost INT,
    goals_for INT, goals_against INT, goal_diff INT, points INT
  ) AS $$
  BEGIN
    RETURN QUERY
    WITH match_data AS (
      SELECT team1 AS team, team1_code AS code, team1_score AS gf, team2_score AS ga
      FROM matches WHERE group_name = p_group AND phase = 'group' AND status = 'finished'
      UNION ALL
      SELECT team2, team2_code, team2_score, team1_score
      FROM matches WHERE group_name = p_group AND phase = 'group' AND status = 'finished'
    )
    SELECT md.team, md.code,
      COUNT(*)::INT, SUM(CASE WHEN md.gf>md.ga THEN 1 ELSE 0 END)::INT,
      SUM(CASE WHEN md.gf=md.ga THEN 1 ELSE 0 END)::INT,
      SUM(CASE WHEN md.gf<md.ga THEN 1 ELSE 0 END)::INT,
      SUM(md.gf)::INT, SUM(md.ga)::INT, (SUM(md.gf)-SUM(md.ga))::INT,
      SUM(CASE WHEN md.gf>md.ga THEN 3 WHEN md.gf=md.ga THEN 1 ELSE 0 END)::INT
    FROM match_data md
    GROUP BY md.team, md.code
    ORDER BY 10 DESC, 9 DESC, 7 DESC, md.team ASC;
  END;
  $$ LANGUAGE plpgsql`,
]

export const SEED_MATCHES = `
INSERT INTO matches (group_name,phase,team1,team2,team1_code,team2_code,stadium,city,match_datetime,status,team1_score,team2_score,betting_closed)
VALUES
('A','group','Mexico','Sudafrica','mx','za','Estadio Azteca','Ciudad de Mexico','2026-06-11 21:00:00+00','finished',2,0,true),
('A','group','Corea del Sur','Republica Checa','kr','cz','Estadio Akron','Zapopan','2026-06-12 00:00:00+00','finished',2,1,true),
('A','group','Republica Checa','Sudafrica','cz','za','Mercedes-Benz Stadium','Atlanta','2026-06-18 16:00:00+00','upcoming',0,0,false),
('A','group','Mexico','Corea del Sur','mx','kr','Estadio Akron','Zapopan','2026-06-19 03:00:00+00','upcoming',0,0,false),
('A','group','Republica Checa','Mexico','cz','mx','Estadio Azteca','Ciudad de Mexico','2026-06-25 01:00:00+00','upcoming',0,0,false),
('A','group','Sudafrica','Corea del Sur','za','kr','Estadio Guadalupe','Guadalajara','2026-06-25 01:00:00+00','upcoming',0,0,false),
('B','group','Canada','Bosnia y Herzegovina','ca','ba','BMO Field','Toronto','2026-06-12 20:00:00+00','finished',1,1,true),
('B','group','Qatar','Suiza','qa','ch','Levi''s Stadium','Santa Clara','2026-06-14 00:00:00+00','finished',1,1,true),
('B','group','Suiza','Bosnia y Herzegovina','ch','ba','SoFi Stadium','Inglewood','2026-06-18 19:00:00+00','upcoming',0,0,false),
('B','group','Canada','Qatar','ca','qa','BC Place','Vancouver','2026-06-18 22:00:00+00','upcoming',0,0,false),
('B','group','Suiza','Canada','ch','ca','BC Place','Vancouver','2026-06-24 19:00:00+00','upcoming',0,0,false),
('B','group','Bosnia y Herzegovina','Qatar','ba','qa','Lumen Field','Seattle','2026-06-24 19:00:00+00','upcoming',0,0,false),
('C','group','Brasil','Marruecos','br','ma','MetLife Stadium','East Rutherford','2026-06-13 22:00:00+00','finished',1,1,true),
('C','group','Haiti','Escocia','ht','gb-sct','Gillette Stadium','Foxborough','2026-06-13 19:00:00+00','finished',0,1,true),
('C','group','Escocia','Marruecos','gb-sct','ma','Gillette Stadium','Foxborough','2026-06-19 22:00:00+00','upcoming',0,0,false),
('C','group','Brasil','Haiti','br','ht','Lincoln Financial Field','Filadelfia','2026-06-20 01:00:00+00','upcoming',0,0,false),
('C','group','Escocia','Brasil','gb-sct','br','Hard Rock Stadium','Miami Gardens','2026-06-24 22:00:00+00','upcoming',0,0,false),
('C','group','Marruecos','Haiti','ma','ht','Mercedes-Benz Stadium','Atlanta','2026-06-24 22:00:00+00','upcoming',0,0,false),
('D','group','Estados Unidos','Paraguay','us','py','SoFi Stadium','Inglewood','2026-06-12 23:00:00+00','finished',4,1,true),
('D','group','Australia','Turquia','au','tr','BC Place','Vancouver','2026-06-14 04:00:00+00','finished',2,0,true),
('D','group','Estados Unidos','Australia','us','au','Lumen Field','Seattle','2026-06-19 19:00:00+00','upcoming',0,0,false),
('D','group','Turquia','Paraguay','tr','py','Levi''s Stadium','Santa Clara','2026-06-20 04:00:00+00','upcoming',0,0,false),
('D','group','Turquia','Estados Unidos','tr','us','SoFi Stadium','Inglewood','2026-06-26 02:00:00+00','upcoming',0,0,false),
('D','group','Paraguay','Australia','py','au','Levi''s Stadium','Santa Clara','2026-06-26 02:00:00+00','upcoming',0,0,false),
('E','group','Alemania','Curacao','de','cw','NRG Stadium','Houston','2026-06-14 17:00:00+00','finished',7,1,true),
('E','group','Costa de Marfil','Ecuador','ci','ec','Lincoln Financial Field','Filadelfia','2026-06-14 20:00:00+00','finished',1,0,true),
('E','group','Alemania','Costa de Marfil','de','ci','BMO Field','Toronto','2026-06-20 20:00:00+00','upcoming',0,0,false),
('E','group','Ecuador','Curacao','ec','cw','Arrowhead Stadium','Kansas City','2026-06-21 00:00:00+00','upcoming',0,0,false),
('E','group','Ecuador','Alemania','ec','de','MetLife Stadium','East Rutherford','2026-06-25 20:00:00+00','upcoming',0,0,false),
('E','group','Curacao','Costa de Marfil','cw','ci','Lincoln Financial Field','Filadelfia','2026-06-25 20:00:00+00','upcoming',0,0,false),
('F','group','Paises Bajos','Japon','nl','jp','AT&T Stadium','Arlington','2026-06-14 23:00:00+00','finished',2,2,true),
('F','group','Suecia','Tunez','se','tn','Estadio Guadalupe','Guadalajara','2026-06-15 02:00:00+00','finished',5,1,true),
('F','group','Paises Bajos','Suecia','nl','se','NRG Stadium','Houston','2026-06-20 17:00:00+00','upcoming',0,0,false),
('F','group','Tunez','Japon','tn','jp','Estadio Guadalupe','Guadalajara','2026-06-21 04:00:00+00','upcoming',0,0,false),
('F','group','Japon','Suecia','jp','se','AT&T Stadium','Arlington','2026-06-25 23:00:00+00','upcoming',0,0,false),
('F','group','Tunez','Paises Bajos','tn','nl','Arrowhead Stadium','Kansas City','2026-06-25 23:00:00+00','upcoming',0,0,false),
('G','group','Belgica','Egipto','be','eg','Lumen Field','Seattle','2026-06-15 22:00:00+00','finished',1,1,true),
('G','group','Iran','Nueva Zelanda','ir','nz','SoFi Stadium','Inglewood','2026-06-16 04:00:00+00','finished',2,2,true),
('G','group','Belgica','Iran','be','ir','SoFi Stadium','Inglewood','2026-06-21 19:00:00+00','upcoming',0,0,false),
('G','group','Nueva Zelanda','Egipto','nz','eg','BC Place','Vancouver','2026-06-22 01:00:00+00','upcoming',0,0,false),
('G','group','Egipto','Iran','eg','ir','Lumen Field','Seattle','2026-06-27 03:00:00+00','upcoming',0,0,false),
('G','group','Nueva Zelanda','Belgica','nz','be','BC Place','Vancouver','2026-06-27 03:00:00+00','upcoming',0,0,false),
('H','group','Espana','Cabo Verde','es','cv','Mercedes-Benz Stadium','Atlanta','2026-06-15 18:00:00+00','finished',0,0,true),
('H','group','Arabia Saudita','Uruguay','sa','uy','Hard Rock Stadium','Miami Gardens','2026-06-15 21:00:00+00','finished',1,1,true),
('H','group','Espana','Arabia Saudita','es','sa','Mercedes-Benz Stadium','Atlanta','2026-06-21 16:00:00+00','upcoming',0,0,false),
('H','group','Uruguay','Cabo Verde','uy','cv','Hard Rock Stadium','Miami Gardens','2026-06-21 22:00:00+00','upcoming',0,0,false),
('H','group','Cabo Verde','Arabia Saudita','cv','sa','NRG Stadium','Houston','2026-06-27 00:00:00+00','upcoming',0,0,false),
('H','group','Uruguay','Espana','uy','es','Estadio Akron','Zapopan','2026-06-27 00:00:00+00','upcoming',0,0,false),
('I','group','Francia','Senegal','fr','sn','MetLife Stadium','East Rutherford','2026-06-16 19:00:00+00','finished',3,1,true),
('I','group','Irak','Noruega','iq','no','Gillette Stadium','Foxborough','2026-06-16 22:00:00+00','upcoming',0,0,false),
('I','group','Francia','Irak','fr','iq','Lincoln Financial Field','Filadelfia','2026-06-22 17:00:00+00','upcoming',0,0,false),
('I','group','Noruega','Senegal','no','sn','MetLife Stadium','East Rutherford','2026-06-23 00:00:00+00','upcoming',0,0,false),
('I','group','Noruega','Francia','no','fr','Gillette Stadium','Foxborough','2026-06-26 19:00:00+00','upcoming',0,0,false),
('I','group','Senegal','Irak','sn','iq','BMO Field','Toronto','2026-06-26 19:00:00+00','upcoming',0,0,false),
('J','group','Argentina','Argelia','ar','dz','Arrowhead Stadium','Kansas City','2026-06-17 01:00:00+00','upcoming',0,0,false),
('J','group','Austria','Jordania','at','jo','Levi''s Stadium','Santa Clara','2026-06-17 04:00:00+00','upcoming',0,0,false),
('J','group','Argentina','Austria','ar','at','AT&T Stadium','Arlington','2026-06-22 17:00:00+00','upcoming',0,0,false),
('J','group','Jordania','Argelia','jo','dz','Levi''s Stadium','Santa Clara','2026-06-23 03:00:00+00','upcoming',0,0,false),
('J','group','Argelia','Austria','dz','at','Arrowhead Stadium','Kansas City','2026-06-28 02:00:00+00','upcoming',0,0,false),
('J','group','Jordania','Argentina','jo','ar','AT&T Stadium','Arlington','2026-06-28 02:00:00+00','upcoming',0,0,false),
('K','group','Portugal','RD Congo','pt','cd','NRG Stadium','Houston','2026-06-17 17:00:00+00','upcoming',0,0,false),
('K','group','Uzbekistan','Colombia','uz','co','Estadio Azteca','Ciudad de Mexico','2026-06-18 02:00:00+00','upcoming',0,0,false),
('K','group','Portugal','Uzbekistan','pt','uz','NRG Stadium','Houston','2026-06-23 17:00:00+00','upcoming',0,0,false),
('K','group','Colombia','RD Congo','co','cd','Estadio Akron','Zapopan','2026-06-24 02:00:00+00','upcoming',0,0,false),
('K','group','Colombia','Portugal','co','pt','Hard Rock Stadium','Miami Gardens','2026-06-27 23:30:00+00','upcoming',0,0,false),
('K','group','RD Congo','Uzbekistan','cd','uz','Mercedes-Benz Stadium','Atlanta','2026-06-27 23:30:00+00','upcoming',0,0,false),
('L','group','Inglaterra','Croacia','gb-eng','hr','AT&T Stadium','Arlington','2026-06-17 20:00:00+00','upcoming',0,0,false),
('L','group','Ghana','Panama','gh','pa','BMO Field','Toronto','2026-06-17 23:00:00+00','upcoming',0,0,false),
('L','group','Inglaterra','Ghana','gb-eng','gh','Gillette Stadium','Foxborough','2026-06-23 20:00:00+00','upcoming',0,0,false),
('L','group','Panama','Croacia','pa','hr','BMO Field','Toronto','2026-06-23 23:00:00+00','upcoming',0,0,false),
('L','group','Panama','Inglaterra','pa','gb-eng','MetLife Stadium','East Rutherford','2026-06-27 21:00:00+00','upcoming',0,0,false),
('L','group','Croacia','Ghana','hr','gh','Lincoln Financial Field','Filadelfia','2026-06-27 21:00:00+00','upcoming',0,0,false)
ON CONFLICT DO NOTHING
`
