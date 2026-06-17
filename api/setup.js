import pkg from 'pg'
import { createClient } from '@supabase/supabase-js'
import { SCHEMA_STATEMENTS, RLS_STATEMENTS, FUNCTION_STATEMENTS, SEED_MATCHES } from './_schema.js'

const { Client } = pkg

function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  return client
}

export default async function handler(req, res) {
  // GET: check initialization status
  if (req.method === 'GET') {
    try {
      const client = await getDbClient()
      try {
        const r = await client.query(`
          SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'profiles'
        `)
        const tableExists = parseInt(r.rows[0].count) > 0
        if (!tableExists) return res.json({ initialized: false })

        const r2 = await client.query(`SELECT COUNT(*) FROM profiles WHERE role = 'admin'`)
        return res.json({ initialized: parseInt(r2.rows[0].count) > 0 })
      } finally {
        await client.end()
      }
    } catch {
      return res.json({ initialized: false })
    }
  }

  // POST: run full initialization
  if (req.method === 'POST') {
    const { adminEmail, adminPassword, adminUsername } = req.body ?? {}
    if (!adminEmail || !adminPassword || !adminUsername) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' })
    }
    if (adminPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'La contrasena debe tener al menos 6 caracteres' })
    }

    let dbClient
    try {
      dbClient = await getDbClient()

      // Check not already initialized
      try {
        const r = await dbClient.query(`SELECT COUNT(*) FROM profiles WHERE role = 'admin'`)
        if (parseInt(r.rows[0].count) > 0) {
          return res.status(409).json({ success: false, error: 'El sistema ya fue inicializado' })
        }
      } catch {
        // table doesn't exist yet, continue
      }

      // 1. Create tables
      for (const sql of SCHEMA_STATEMENTS) {
        await dbClient.query(sql)
      }

      // 2. RLS policies (idempotent: drop + create)
      for (const sql of RLS_STATEMENTS) {
        try { await dbClient.query(sql) } catch { /* ignore if policy already exists */ }
      }

      // 3. Functions
      for (const sql of FUNCTION_STATEMENTS) {
        await dbClient.query(sql)
      }

      // 4. Add unique constraint for seed idempotency
      try {
        await dbClient.query(`
          ALTER TABLE matches ADD CONSTRAINT matches_unique_fixture
          UNIQUE (team1, team2, match_datetime)
        `)
      } catch { /* constraint already exists */ }

      // 5. Seed matches
      await dbClient.query(SEED_MATCHES)

      // 6. Create admin via Supabase Auth
      const supabaseAdmin = getSupabaseAdmin()
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      })
      if (authErr) throw new Error(`Auth error: ${authErr.message}`)

      const adminId = authData.user.id
      const ADMIN_CHIPS = 9999999

      // 7. Create admin profile
      await dbClient.query(`
        INSERT INTO profiles (id, username, email, role, chips_balance)
        VALUES ($1, $2, $3, 'admin', $4)
        ON CONFLICT (id) DO NOTHING
      `, [adminId, adminUsername, adminEmail, ADMIN_CHIPS])

      // 8. Initial transaction for admin
      await dbClient.query(`
        INSERT INTO transactions (user_id, amount, type, description, balance_after)
        VALUES ($1, $2, 'initial_deposit', 'Cuenta de la casa', $2)
      `, [adminId, ADMIN_CHIPS])

      return res.json({ success: true, message: 'Sistema inicializado correctamente' })

    } catch (err) {
      console.error('Setup error:', err)
      return res.status(500).json({ success: false, error: err.message })
    } finally {
      if (dbClient) try { await dbClient.end() } catch {}
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
