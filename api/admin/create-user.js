import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, email, password, chips = 100 } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' })
  }

  try {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authErr) throw authErr

    const userId = authData.user.id

    const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      username,
      email,
      role: 'user',
      chips_balance: chips,
    })

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw profileErr
    }

    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      amount: chips,
      type: 'initial_deposit',
      description: 'Saldo inicial de bienvenida',
      balance_after: chips,
    })

    return res.json({ success: true, userId })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
