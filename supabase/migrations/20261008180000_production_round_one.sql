-- Incremental: pago reportado retiene reserva; expiración solo sin pago reportado.
BEGIN;
CREATE OR REPLACE FUNCTION public.release_expired_reservations(p_inventory_item_id uuid DEFAULT NULL::uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE oid uuid; affected integer:=0; n integer; checked_at timestamptz;
BEGIN
 FOR oid IN SELECT id FROM public.orders WHERE order_type='online' AND status='pendiente_pago'
  AND reserved_until<=clock_timestamp() AND (p_inventory_item_id IS NULL OR EXISTS
   (SELECT 1 FROM public.inventory_reservations WHERE order_id=orders.id AND inventory_item_id=p_inventory_item_id)) ORDER BY id LOOP
  PERFORM id FROM public.orders WHERE id=oid FOR UPDATE;
  PERFORM id FROM public.payments WHERE order_id=oid ORDER BY id FOR UPDATE;
  PERFORM id FROM public.inventory_reservations WHERE order_id=oid ORDER BY inventory_item_id,id FOR UPDATE;
  checked_at:=clock_timestamp();
  IF NOT EXISTS(SELECT 1 FROM public.payments WHERE order_id=oid AND status IN ('pendiente','confirmado')) AND EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND status='pendiente_pago') AND
   (EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND reserved_until<=checked_at) OR
    EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=oid AND status='reserved' AND expires_at<=checked_at)) THEN
   UPDATE public.inventory_reservations SET status='released',released_at=checked_at WHERE order_id=oid AND status='reserved';
   GET DIAGNOSTICS n=ROW_COUNT; affected:=affected+n;
   UPDATE public.orders SET status='cancelado',cancelled_at=checked_at,cancellation_reason='Reserva de inventario vencida.',updated_at=checked_at WHERE id=oid AND status='pendiente_pago';
  END IF;
 END LOOP;
 RETURN affected;
END;
$function$;
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
  FOR UPDATE OF o;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'No encontramos un pedido con esos datos.';
  END IF;
  IF v_order.status <> 'pendiente_pago' OR v_order.order_type <> 'online' THEN
    RAISE EXCEPTION 'Este pedido ya no admite un pago nuevo.';
  END IF;
  IF v_order.total IS NULL OR v_order.total <= 0 OR v_order.total::text = 'NaN' THEN
    RAISE EXCEPTION 'El pedido no tiene un monto válido para reportar pago.';
  END IF;
  PERFORM p.id FROM public.payments p WHERE p.order_id=p_order_id ORDER BY p.id FOR UPDATE;
  PERFORM ir.id FROM public.inventory_reservations ir WHERE ir.order_id=p_order_id ORDER BY ir.inventory_item_id,ir.id FOR UPDATE;
  SELECT count(*) INTO v_pending_count FROM public.payments p WHERE p.order_id=p_order_id AND p.status='pendiente';
  IF v_pending_count>1 THEN RAISE EXCEPTION 'Hay pagos pendientes duplicados. Requiere revisión administrativa.'; END IF;
  SELECT p.* INTO v_payment FROM public.payments p WHERE p.order_id=p_order_id AND p.status='pendiente';
  IF v_payment.id IS NOT NULL THEN
    IF v_payment.amount IS DISTINCT FROM v_order.total OR v_payment.method<>'qr' THEN RAISE EXCEPTION 'El pago pendiente no coincide con el pedido.'; END IF;
  ELSE
    IF v_order.reserved_until IS NULL OR v_order.reserved_until<=clock_timestamp() OR EXISTS
      (SELECT 1 FROM public.inventory_reservations ir WHERE ir.order_id=p_order_id AND (ir.status<>'reserved' OR ir.expires_at<=clock_timestamp())) THEN
      RAISE EXCEPTION 'La reserva del pedido venció. No se puede reportar el pago.';
    END IF;
    IF EXISTS(SELECT 1 FROM public.payments p WHERE p.order_id=p_order_id AND p.status='confirmado') THEN RAISE EXCEPTION 'Este pedido ya tiene un pago confirmado.'; END IF;
    INSERT INTO public.payments(order_id,method,amount,status) VALUES(p_order_id,'qr',v_order.total,'pendiente') RETURNING * INTO v_payment;
  END IF;
  -- Mantener la reserva hasta revisión. No consume stock ni registra caja.
  UPDATE public.orders SET reserved_until=NULL,updated_at=clock_timestamp() WHERE orders.id=p_order_id;
  UPDATE public.inventory_reservations SET expires_at='infinity'::timestamptz WHERE order_id=p_order_id AND inventory_reservations.status='reserved';
  -- Reintentos serializados por el bloqueo del pedido reutilizan el mismo id.
  RETURN QUERY SELECT v_payment.id, v_payment.amount, v_payment.method, v_payment.status, v_order.order_number;
END;
$payment$;
-- La creación de un pedido normal ya no avisa al personal.
CREATE OR REPLACE FUNCTION public.notify_new_order() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 -- INSERT todavía no tiene el total definitivo: nunca avisar en este momento.
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.notify_free_order_confirmed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF OLD.status='pendiente_pago' AND NEW.status='confirmado' AND NEW.order_type='online'
  AND NEW.subtotal>0 AND NEW.total=0 AND NEW.discount_total=NEW.subtotal THEN
  INSERT INTO public.notifications(type,message,reference_type,reference_id) VALUES('nuevo_pedido','Pedido gratuito confirmado #'||NEW.order_number,'order',NEW.id);
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_free_order_confirmed() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER notify_free_order_confirmed AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_free_order_confirmed();
-- Reutiliza trg_notify_pending_payment: un aviso por pago insertado.
-- Ubicación: reutiliza configuración y su trigger de auditoría existente.
INSERT INTO public.system_settings(key,value,is_critical) VALUES('store_location','{}'::jsonb,false) ON CONFLICT(key) DO NOTHING;
-- Conserva reservas de pagos ya reportados antes de esta actualización.
UPDATE public.inventory_reservations r SET expires_at='infinity'::timestamptz
WHERE r.status='reserved' AND EXISTS(SELECT 1 FROM public.orders o JOIN public.payments p ON p.order_id=o.id
 WHERE o.id=r.order_id AND o.status='pendiente_pago' AND p.status='pendiente');
UPDATE public.orders o SET reserved_until=NULL WHERE o.status='pendiente_pago'
AND EXISTS(SELECT 1 FROM public.payments p WHERE p.order_id=o.id AND p.status='pendiente');
REVOKE ALL ON FUNCTION public.create_payment(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment(uuid,text) TO service_role;
-- Supabase Cron procesa abandonos incluso cuando no hay visitas al sitio.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('anabelle-expire-unreported-orders','* * * * *','SELECT public.release_expired_reservations(NULL);');
COMMIT;
