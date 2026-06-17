import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function handler(req, res) {
  const admin = getAdmin()

  if (req.method === 'GET') {
    try {
      const { data, error } = await admin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
      if (error) return res.json({ initialized: false, reason: error.message })
      return res.json({ initialized: (data?.length ?? 0) > 0 })
    } catch (e) {
      return res.json({ initialized: false, reason: e.message })
    }
  }

  if (req.method === 'POST') {
    const { adminEmail, adminPassword, adminUsername } = req.body ?? {}
    if (!adminEmail || !adminPassword || !adminUsername) {
      return res.status(400).json({ success: false, error: 'Faltan campos' })
    }
    if (adminPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Contrasena minimo 6 caracteres' })
    }
    try {
      // Verificar que las tablas existan antes de continuar
      const { error: tableCheck } = await admin.from('profiles').select('id').limit(1)
      if (tableCheck?.code === '42P01') {
        return res.status(400).json({
          success: false,
          error: 'Las tablas no existen. Ejecuta primero el SQL en Supabase.'
        })
      }

      // Verificar que no haya admin ya
      const { data: existing } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1)
      if (existing?.length > 0) {
        return res.status(409).json({ success: false, error: 'Ya existe un administrador' })
      }

      // Crear usuario en Supabase Auth
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      })
      if (authErr) throw new Error(authErr.message)

      const adminId = authData.user.id
      const CHIPS = 9999999

      const { error: profileErr } = await admin.from('profiles').insert({
        id: adminId,
        username: adminUsername,
        email: adminEmail,
        role: 'admin',
        chips_balance: CHIPS,
      })
      if (profileErr) throw new Error(profileErr.message)

      await admin.from('transactions').insert({
        user_id: adminId,
        amount: CHIPS,
        type: 'initial_deposit',
        description: 'Cuenta de la casa',
        balance_after: CHIPS,
      })

      return res.json({ success: true })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
