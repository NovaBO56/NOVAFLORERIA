-- Prueba transaccional LOCAL. Termina en ROLLBACK: no conserva pedidos ni cambios.
BEGIN;
LOCK TABLE public.orders IN EXCLUSIVE MODE;

DO $test$
DECLARE
  next_number bigint;
  actor_id uuid;
  was_blocked boolean := false;
  invalid_value_blocked boolean := false;
  audit_before bigint;
  audit_after bigint;
BEGIN
  SELECT coalesce(max(order_number), 0) + 1 INTO next_number FROM public.orders;
  SELECT id INTO actor_id FROM public.profiles WHERE role = 'administrador' AND is_active = true LIMIT 1;
  IF actor_id IS NULL THEN RAISE EXCEPTION 'La prueba requiere el administrador sintético ya existente en el laboratorio local.'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key='delivery_enabled' AND value='{"enabled":true}'::jsonb) THEN
    RAISE EXCEPTION 'La migración debe habilitar la entrega por defecto.';
  END IF;

  SELECT count(*) INTO audit_before FROM public.audit_logs WHERE table_name='system_settings';
  UPDATE public.system_settings SET value='{"enabled":false}'::jsonb, updated_by=actor_id, updated_at=now() WHERE key='delivery_enabled';
  SELECT count(*) INTO audit_after FROM public.audit_logs WHERE table_name='system_settings';
  IF audit_after <> audit_before + 1 THEN RAISE EXCEPTION 'El cambio de disponibilidad no registró el actor en auditoría.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.audit_logs WHERE table_name='system_settings' AND user_id=actor_id AND after->>'key'='delivery_enabled') THEN
    RAISE EXCEPTION 'La auditoría no identifica al administrador responsable.';
  END IF;

  BEGIN
    UPDATE public.system_settings SET value='{}'::jsonb WHERE key='delivery_enabled';
  EXCEPTION WHEN check_violation THEN
    invalid_value_blocked := true;
  END;
  IF NOT invalid_value_blocked THEN RAISE EXCEPTION 'La configuración aceptó un valor sin booleano enabled.'; END IF;

  BEGIN
    INSERT INTO public.orders(order_number, customer_message)
    VALUES(next_number, E'Método: Entrega por coordinar\nDirección sintética local');
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM NOT LIKE '%temporalmente no disponible%' THEN RAISE; END IF;
    was_blocked := true;
  END;
  IF NOT was_blocked THEN RAISE EXCEPTION 'La base aceptó una nueva entrega estando desactivada.'; END IF;

  INSERT INTO public.orders(order_number, customer_message)
  VALUES(next_number + 1, 'Método: Retiro en tienda');

  UPDATE public.system_settings SET value='{"enabled":true}'::jsonb, updated_by=actor_id, updated_at=now() WHERE key='delivery_enabled';
  INSERT INTO public.orders(order_number, customer_message)
  VALUES(next_number + 2, E'Método: Entrega por coordinar\nDirección sintética local');
END;
$test$;

ROLLBACK;
