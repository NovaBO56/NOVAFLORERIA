-- Definición oficial propuesta: SOLO servidor, teléfono validado atómicamente.
CREATE OR REPLACE FUNCTION public.create_payment(p_order_id uuid, p_customer_phone text)
RETURNS TABLE(id uuid, amount numeric, method text, status text, order_number bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $payment$
DECLARE
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_pending_count integer;
BEGIN
  -- La ACL es la frontera servidor/cliente; la comprobación siguiente evita
  -- que un bug del servidor transforme un UUID ajeno en autorización de pago.
  SELECT o.* INTO v_order
  FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
  WHERE o.id = p_order_id AND o.deleted_at IS NULL
    AND nullif(trim(p_customer_phone), '') IS NOT NULL
    AND (c.phone = trim(p_customer_phone) OR c.whatsapp = trim(p_customer_phone))
  FOR UPDATE OF o, c;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'No encontramos un pedido con esos datos.';
  END IF;
  IF v_order.status <> 'pendiente_pago' OR v_order.order_type <> 'online' THEN
    RAISE EXCEPTION 'Este pedido ya no admite un pago nuevo.';
  END IF;
  IF v_order.total IS NULL OR v_order.total <= 0 OR v_order.total::text = 'NaN' THEN
    RAISE EXCEPTION 'El pedido no tiene un monto válido para reportar pago.';
  END IF;
  IF v_order.reserved_until IS NOT NULL AND v_order.reserved_until <= now() THEN
    RAISE EXCEPTION 'La reserva del pedido venció. No se puede reportar el pago.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.inventory_reservations ir WHERE ir.order_id = p_order_id
             AND (ir.status <> 'reserved' OR ir.expires_at <= now())) THEN
    RAISE EXCEPTION 'La reserva del pedido ya no está vigente.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.payments p WHERE p.order_id = p_order_id AND p.status = 'confirmado') THEN
    RAISE EXCEPTION 'Este pedido ya tiene un pago confirmado.';
  END IF;
  SELECT count(*) INTO v_pending_count FROM public.payments p
  WHERE p.order_id = p_order_id AND p.status = 'pendiente';
  IF v_pending_count > 1 THEN
    RAISE EXCEPTION 'Hay pagos pendientes duplicados. Requiere revisión administrativa.';
  END IF;
  SELECT p.* INTO v_payment FROM public.payments p
  WHERE p.order_id = p_order_id AND p.status = 'pendiente' FOR UPDATE;
  IF v_payment.id IS NULL THEN
    INSERT INTO public.payments (order_id, method, amount, status)
    VALUES (p_order_id, 'qr', v_order.total, 'pendiente') RETURNING * INTO v_payment;
  ELSIF v_payment.amount IS DISTINCT FROM v_order.total OR v_payment.method <> 'qr' THEN
    RAISE EXCEPTION 'El pago pendiente no coincide con el pedido. Requiere revisión administrativa.';
  END IF;
  -- Reintentos serializados por el bloqueo del pedido reutilizan el mismo id.
  RETURN QUERY SELECT v_payment.id, v_payment.amount, v_payment.method, v_payment.status, v_order.order_number;
END;
$payment$;
