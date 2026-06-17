import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TrophyIcon, CheckIcon, ShieldIcon, BallIcon, XIcon } from '../assets/Icons'

const SQL_URL = 'https://raw.githubusercontent.com/placeholder/schema.sql'

const STEPS_LABELS = ['Ejecutar SQL', 'Crear admin']

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} className="btn btn-gold btn-sm" style={{ minWidth: 120 }}>
      {copied ? <><CheckIcon size={14} /> Copiado</> : 'Copiar SQL'}
    </button>
  )
}

export default function SetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')
  const [form, setForm] = useState({ adminUsername: '', adminEmail: '', adminPassword: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function verifyTablesAndContinue() {
    setChecking(true)
    setCheckError('')
    const { error } = await supabase.from('profiles').select('id').limit(1)
    setChecking(false)
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      setCheckError('Las tablas no se encontraron. Asegurate de haber copiado y ejecutado TODO el SQL en Supabase SQL Editor.')
      return
    }
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows, which is fine
      setCheckError(`Error: ${error.message}`)
      return
    }
    setStep(2)
  }

  async function handleCreateAdmin(e) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setStep(3)
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      setCreateError(e.message)
    }
    setCreating(false)
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <svg className="field-lines" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.04 }}>
          <rect x="40" y="40" width="720" height="520" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="400" cy="300" r="80" fill="none" stroke="white" strokeWidth="2" />
          <line x1="400" y1="40" x2="400" y2="560" stroke="white" strokeWidth="2" />
          <rect x="40" y="190" width="120" height="220" fill="none" stroke="white" strokeWidth="2" />
          <rect x="640" y="190" width="120" height="220" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: step === 1 ? 680 : 420, padding: '24px 16px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--r-lg)',
            background: 'var(--gold-glow)', border: '2px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)', margin: '0 auto 12px'
          }}>
            <TrophyIcon size={26} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)' }}>
            Mundial Bet 2026
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: 4 }}>
            Configuracion inicial — {step === 3 ? 'Completado' : `Paso ${step} de 2`}
          </p>
        </div>

        {/* Step indicators */}
        {step < 3 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {STEPS_LABELS.map((label, i) => {
              const n = i + 1
              const active = step === n
              const done = step > n
              return (
                <div key={n} style={{
                  flex: 1, padding: '8px 12px',
                  background: done ? 'var(--green-bg)' : active ? 'var(--gold-glow)' : 'var(--bg-card)',
                  border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(240,180,41,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: done ? 'var(--green)' : active ? 'var(--gold)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 800,
                    color: done || active ? '#000' : 'var(--text-3)'
                  }}>
                    {done ? <CheckIcon size={12} /> : n}
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: done ? 'var(--green)' : active ? 'var(--gold)' : 'var(--text-3)' }}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* STEP 1: Run SQL */}
        {step === 1 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>Paso 1: Ejecutar SQL en Supabase</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Copia el SQL de abajo, abre el <strong style={{ color: 'var(--gold)' }}>SQL Editor</strong> de tu proyecto Supabase, pegalo y presiona <strong style={{ color: 'var(--gold)' }}>Run</strong>.
              </p>
            </div>

            {/* Instructions */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: 1, text: 'Ve a', link: 'https://supabase.com/dashboard', linkText: 'supabase.com/dashboard' },
                { n: 2, text: 'Selecciona tu proyecto → SQL Editor (icono de base de datos en el sidebar)' },
                { n: 3, text: 'Copia el SQL de abajo con el boton' },
                { n: 4, text: 'Pegalo en el editor y presiona el boton verde "Run"' },
                { n: 5, text: 'Regresa aqui y haz clic en "Ya ejecute el SQL"' },
              ].map(({ n, text, link, linkText }) => (
                <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--gold-glow)', border: '1px solid rgba(240,180,41,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 800, color: 'var(--gold)', marginTop: 1
                  }}>
                    {n}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    {text}{' '}
                    {link && <a href={link} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>{linkText}</a>}
                  </span>
                </div>
              ))}
            </div>

            {/* SQL block */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>schema.sql</span>
                <CopyButton text={SQL_SCHEMA} />
              </div>
              <pre style={{
                background: 'var(--bg-0)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', padding: '14px 16px',
                fontSize: '0.72rem', color: 'var(--text-2)', lineHeight: 1.5,
                overflow: 'auto', maxHeight: 220, margin: 0,
                fontFamily: 'monospace', whiteSpace: 'pre',
              }}>
                {SQL_SCHEMA.slice(0, 800)}
                <span style={{ color: 'var(--text-3)' }}>{'\n... (usa el boton Copiar para obtener el SQL completo)'}</span>
              </pre>
            </div>

            {checkError && (
              <div style={{ margin: '0 24px 16px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--red)', display: 'flex', gap: 8 }}>
                <XIcon size={16} style={{ flexShrink: 0 }} /> {checkError}
              </div>
            )}

            <div style={{ padding: '16px 24px' }}>
              <button
                className="btn btn-gold btn-lg btn-block"
                onClick={verifyTablesAndContinue}
                disabled={checking}
              >
                {checking
                  ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verificando...</>
                  : <><CheckIcon size={18} /> Ya ejecute el SQL — Continuar</>
                }
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Create admin */}
        {step === 2 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '28px 24px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>Paso 2: Crear cuenta de administrador</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 20 }}>
              Estas credenciales son las que usaras para iniciar sesion como admin.
            </p>
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nombre de usuario</label>
                <input className="form-input" required placeholder="admin" autoFocus
                  value={form.adminUsername}
                  onChange={e => setForm(f => ({ ...f, adminUsername: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" required placeholder="admin@mundialbet.com"
                  value={form.adminEmail}
                  onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Contrasena (min 6 caracteres)</label>
                <input type="password" className="form-input" required minLength={6} placeholder="••••••••"
                  value={form.adminPassword}
                  onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} />
              </div>
              {createError && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--red)', display: 'flex', gap: 8 }}>
                  <ShieldIcon size={16} style={{ flexShrink: 0 }} /> {createError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Atras</button>
                <button type="submit" className="btn btn-gold btn-block" disabled={creating}>
                  {creating
                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creando...</>
                    : <><BallIcon size={18} /> Crear admin e iniciar</>
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Done */}
        {step === 3 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--green-bg)', border: '2px solid var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: 'var(--green)'
            }}>
              <CheckIcon size={32} />
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green)' }}>Sistema listo</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: 8 }}>
              Redirigiendo al inicio de sesion...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// SQL completo embebido en el cliente para poder copiarlo
const SQL_SCHEMA = `-- MUNDIAL BET 2026 — ejecutar en Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  chips_balance NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  espn_event_id TEXT,
  group_name TEXT,
  phase TEXT NOT NULL DEFAULT 'group' CHECK (phase IN ('group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final')),
  team1 TEXT NOT NULL, team2 TEXT NOT NULL,
  team1_code TEXT NOT NULL DEFAULT 'un', team2_code TEXT NOT NULL DEFAULT 'un',
  stadium TEXT, city TEXT,
  match_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','finished','cancelled')),
  team1_score INTEGER DEFAULT 0, team2_score INTEGER DEFAULT 0,
  betting_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('team1_win','draw','team2_win')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','won','lost','cancelled')),
  potential_win NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(), settled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('initial_deposit','bet_placed','bet_won','bet_lost','admin_adjustment')),
  description TEXT NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  related_bet_id UUID REFERENCES bets(id),
  match_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
$$;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "matches_select_all" ON matches;
CREATE POLICY "matches_select_all" ON matches FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "matches_all_admin" ON matches;
CREATE POLICY "matches_all_admin" ON matches FOR ALL TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "bets_select_own" ON bets;
CREATE POLICY "bets_select_own" ON bets FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "bets_all_admin" ON bets;
CREATE POLICY "bets_all_admin" ON bets FOR ALL TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "transactions_all_admin" ON transactions;
CREATE POLICY "transactions_all_admin" ON transactions FOR ALL TO authenticated USING (is_admin());

CREATE OR REPLACE FUNCTION place_bet(p_match_id UUID, p_bet_type TEXT, p_amount NUMERIC) RETURNS JSON AS $$
DECLARE v_user_id UUID := auth.uid(); v_balance NUMERIC; v_match RECORD; v_bet_id UUID; v_new_balance NUMERIC;
BEGIN
  SELECT chips_balance INTO v_balance FROM profiles WHERE id = v_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RETURN json_build_object('success',false,'error','Usuario no encontrado'); END IF;
  IF v_balance < p_amount THEN RETURN json_build_object('success',false,'error','Balance insuficiente'); END IF;
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF v_match IS NULL THEN RETURN json_build_object('success',false,'error','Partido no encontrado'); END IF;
  IF v_match.status != 'upcoming' OR v_match.betting_closed OR v_match.match_datetime <= NOW() THEN
    RETURN json_build_object('success',false,'error','Apuestas cerradas para este partido'); END IF;
  v_new_balance := v_balance - p_amount;
  INSERT INTO bets (user_id,match_id,bet_type,amount,potential_win) VALUES (v_user_id,p_match_id,p_bet_type,p_amount,p_amount*2) RETURNING id INTO v_bet_id;
  UPDATE profiles SET chips_balance=v_new_balance, updated_at=NOW() WHERE id=v_user_id;
  INSERT INTO transactions (user_id,amount,type,description,balance_after,related_bet_id,match_info)
  VALUES (v_user_id,-p_amount,'bet_placed','Apuesta: '||v_match.team1||' vs '||v_match.team2,v_new_balance,v_bet_id,v_match.team1||' vs '||v_match.team2);
  RETURN json_build_object('success',true,'bet_id',v_bet_id,'new_balance',v_new_balance);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION settle_match_bets(p_match_id UUID, p_team1_score INTEGER, p_team2_score INTEGER) RETURNS JSON AS $$
DECLARE v_result TEXT; v_bet RECORD; v_user_balance NUMERIC; v_new_balance NUMERIC; v_won INTEGER:=0; v_lost INTEGER:=0;
BEGIN
  IF p_team1_score>p_team2_score THEN v_result:='team1_win'; ELSIF p_team1_score<p_team2_score THEN v_result:='team2_win'; ELSE v_result:='draw'; END IF;
  UPDATE matches SET status='finished',team1_score=p_team1_score,team2_score=p_team2_score,betting_closed=TRUE,updated_at=NOW() WHERE id=p_match_id;
  FOR v_bet IN SELECT b.*,m.team1,m.team2 FROM bets b JOIN matches m ON b.match_id=m.id WHERE b.match_id=p_match_id AND b.status='pending'
  LOOP
    SELECT chips_balance INTO v_user_balance FROM profiles WHERE id=v_bet.user_id FOR UPDATE;
    IF v_bet.bet_type=v_result THEN
      v_new_balance:=v_user_balance+(v_bet.amount*2);
      UPDATE bets SET status='won',settled_at=NOW() WHERE id=v_bet.id;
      UPDATE profiles SET chips_balance=v_new_balance,updated_at=NOW() WHERE id=v_bet.user_id;
      INSERT INTO transactions (user_id,amount,type,description,balance_after,related_bet_id,match_info)
      VALUES (v_bet.user_id,v_bet.amount*2,'bet_won','Apuesta ganada: '||v_bet.team1||' vs '||v_bet.team2,v_new_balance,v_bet.id,v_bet.team1||' vs '||v_bet.team2);
      v_won:=v_won+1;
    ELSE
      UPDATE bets SET status='lost',settled_at=NOW() WHERE id=v_bet.id;
      INSERT INTO transactions (user_id,amount,type,description,balance_after,related_bet_id,match_info)
      VALUES (v_bet.user_id,0,'bet_lost','Apuesta perdida: '||v_bet.team1||' vs '||v_bet.team2,v_user_balance,v_bet.id,v_bet.team1||' vs '||v_bet.team2);
      v_lost:=v_lost+1;
    END IF;
  END LOOP;
  RETURN json_build_object('success',true,'won',v_won,'lost',v_lost,'result',v_result);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS matches_unique_fixture UNIQUE (team1,team2,match_datetime);

INSERT INTO matches (group_name,phase,team1,team2,team1_code,team2_code,stadium,city,match_datetime,status,team1_score,team2_score,betting_closed) VALUES
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
ON CONFLICT DO NOTHING;`
