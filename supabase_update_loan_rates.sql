-- Corregir prestamos existentes con decimales + bajar tasas
-- Ejecutar en Supabase SQL Editor

-- 1. Redondear hacia arriba los prestamos activos que tengan decimales
UPDATE loans
SET total_to_pay = CEIL(total_to_pay)
WHERE status = 'active' AND total_to_pay <> CEIL(total_to_pay);

-- 2. Actualizar funcion con nuevas tasas y CEIL
--     1-10  →  5%
--    11-20  → 10%
--    21-30  → 18%
--    31-40  → 28%
--    41-50  → 40%
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

  IF p_amount <= 10 THEN
    v_interest_rate := 5;
  ELSIF p_amount <= 20 THEN
    v_interest_rate := 10;
  ELSIF p_amount <= 30 THEN
    v_interest_rate := 18;
  ELSIF p_amount <= 40 THEN
    v_interest_rate := 28;
  ELSE
    v_interest_rate := 40;
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
