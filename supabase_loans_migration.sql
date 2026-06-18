-- ============================================================
-- MIGRACION: Sistema de Prestamos con Intereses
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de prestamos
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  total_to_pay NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 2. Ampliar el CHECK de transactions para incluir tipos de prestamo
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN (
    'initial_deposit','bet_placed','bet_won','bet_lost','admin_adjustment',
    'loan_received','loan_payment'
  ));

-- 3. RLS para loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loans_select_own" ON loans;
CREATE POLICY "loans_select_own" ON loans
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "loans_insert_fn" ON loans;
CREATE POLICY "loans_insert_fn" ON loans
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "loans_update_fn" ON loans;
CREATE POLICY "loans_update_fn" ON loans
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_admin());

-- 4. Funcion: solicitar prestamo
--    Intereses escalonados (mas fichas = mas interes):
--      1-10 FCH  →  8%
--     11-20 FCH  → 15%
--     21-30 FCH  → 25%
--     31-40 FCH  → 40%
--     41-50 FCH  → 60%
CREATE OR REPLACE FUNCTION request_loan(p_amount NUMERIC)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_balance NUMERIC;
  v_interest_rate NUMERIC;
  v_total_to_pay NUMERIC;
  v_loan_id UUID;
  v_new_balance NUMERIC;
  v_existing UUID;
BEGIN
  SELECT chips_balance INTO v_balance
  FROM profiles WHERE id = v_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  IF v_balance >= 10 THEN
    RETURN json_build_object('success', false, 'error',
      'Solo puedes pedir prestamo si tienes menos de 10 fichas');
  END IF;

  IF p_amount < 1 OR p_amount > 50 THEN
    RETURN json_build_object('success', false, 'error',
      'El monto debe ser entre 1 y 50 fichas');
  END IF;

  SELECT id INTO v_existing
  FROM loans WHERE user_id = v_user_id AND status = 'active' LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error',
      'Ya tienes un prestamo activo. Pagalo antes de pedir otro.');
  END IF;

  -- Calcular interes segun tramo
  IF p_amount <= 10 THEN
    v_interest_rate := 8;
  ELSIF p_amount <= 20 THEN
    v_interest_rate := 15;
  ELSIF p_amount <= 30 THEN
    v_interest_rate := 25;
  ELSIF p_amount <= 40 THEN
    v_interest_rate := 40;
  ELSE
    v_interest_rate := 60;
  END IF;

  v_total_to_pay := CEIL(p_amount * (1 + v_interest_rate / 100.0));

  INSERT INTO loans (user_id, amount, interest_rate, total_to_pay)
  VALUES (v_user_id, p_amount, v_interest_rate, v_total_to_pay)
  RETURNING id INTO v_loan_id;

  v_new_balance := v_balance + p_amount;
  UPDATE profiles SET chips_balance = v_new_balance, updated_at = NOW()
  WHERE id = v_user_id;

  INSERT INTO transactions (user_id, amount, type, description, balance_after)
  VALUES (v_user_id, p_amount, 'loan_received',
    'Prestamo de ' || p_amount || ' FCH — debes ' || v_total_to_pay ||
    ' FCH (' || v_interest_rate || '% interes)',
    v_new_balance);

  RETURN json_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'new_balance', v_new_balance,
    'total_to_pay', v_total_to_pay,
    'interest_rate', v_interest_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Funcion: pagar prestamo (parcial o total)
CREATE OR REPLACE FUNCTION pay_loan(p_loan_id UUID, p_amount NUMERIC)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_balance NUMERIC;
  v_loan RECORD;
  v_remaining NUMERIC;
  v_pay NUMERIC;
  v_new_balance NUMERIC;
  v_new_status TEXT;
BEGIN
  SELECT * INTO v_loan
  FROM loans WHERE id = p_loan_id AND user_id = v_user_id AND status = 'active';

  IF v_loan IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Prestamo no encontrado');
  END IF;

  SELECT chips_balance INTO v_balance
  FROM profiles WHERE id = v_user_id FOR UPDATE;

  v_remaining := v_loan.total_to_pay - v_loan.amount_paid;
  v_pay := LEAST(p_amount, v_remaining);

  IF v_balance < v_pay THEN
    RETURN json_build_object('success', false, 'error', 'Balance insuficiente');
  END IF;

  IF v_pay <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Monto invalido');
  END IF;

  v_new_balance := v_balance - v_pay;
  v_new_status := CASE WHEN v_loan.amount_paid + v_pay >= v_loan.total_to_pay
                        THEN 'paid' ELSE 'active' END;

  UPDATE profiles SET chips_balance = v_new_balance, updated_at = NOW()
  WHERE id = v_user_id;

  UPDATE loans
  SET amount_paid = amount_paid + v_pay,
      status = v_new_status,
      paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE NULL END
  WHERE id = p_loan_id;

  INSERT INTO transactions (user_id, amount, type, description, balance_after)
  VALUES (v_user_id, -v_pay, 'loan_payment',
    'Pago prestamo: ' || v_pay || ' FCH — quedan ' ||
    GREATEST(0, v_remaining - v_pay) || ' FCH',
    v_new_balance);

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'paid', v_pay,
    'remaining', GREATEST(0, v_remaining - v_pay),
    'fully_paid', v_new_status = 'paid'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
