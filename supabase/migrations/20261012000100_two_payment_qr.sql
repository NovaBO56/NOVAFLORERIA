-- Candidate for review. Apply only after approval; historical migrations stay intact.
-- Preserve every existing image/configuration as QR 1, including inactive history.
BEGIN;
ALTER TABLE public.payment_qr_config ADD COLUMN qr_slot text NOT NULL DEFAULT 'qr_1'
  CHECK (qr_slot IN ('qr_1','qr_2'));
DROP INDEX public.payment_qr_one_active;
CREATE UNIQUE INDEX payment_qr_one_active_per_slot ON public.payment_qr_config(qr_slot) WHERE is_active;

ALTER TABLE public.payments
  ADD COLUMN qr_slot text CHECK (qr_slot IN ('qr_1','qr_2')),
  ADD COLUMN qr_label text CHECK (length(qr_label) BETWEEN 1 AND 200),
  ADD COLUMN qr_config_id uuid REFERENCES public.payment_qr_config(id) ON DELETE RESTRICT;
ALTER TABLE public.payments ADD CONSTRAINT payment_qr_snapshot_complete
  CHECK (num_nonnulls(qr_slot,qr_label,qr_config_id) IN (0,3));
-- Historical payments remain unknown, rather than inventing which QR was used.

CREATE FUNCTION public.set_payment_qr_slot(p_actor uuid,p_slot text,p_active boolean,
  p_value text DEFAULT NULL,p_storage_path text DEFAULT NULL,p_label text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE current_qr public.payment_qr_config%rowtype; result jsonb; label text; active boolean;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND role='administrador' AND is_active)
    THEN RAISE EXCEPTION 'Administrador activo requerido.'; END IF;
  IF p_slot IS NULL OR p_slot NOT IN ('qr_1','qr_2') THEN RAISE EXCEPTION 'Configuración de QR inválida.'; END IF;
  IF p_label IS NOT NULL AND (nullif(trim(p_label),'') IS NULL OR length(trim(p_label))>200) THEN RAISE EXCEPTION 'Etiqueta de QR inválida.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('checkout_config:qr:'||p_slot,0));
  PERFORM set_config('nova.audit_actor',p_actor::text,true);
  SELECT * INTO current_qr FROM public.payment_qr_config WHERE qr_slot=p_slot ORDER BY created_at DESC,id DESC LIMIT 1 FOR UPDATE;
  active:=coalesce(p_active,current_qr.is_active,false);
  label:=coalesce(nullif(trim(p_label),''),nullif(trim(current_qr.account_label),''),CASE p_slot WHEN 'qr_1' THEN 'QR 1' ELSE 'QR 2' END);
  IF p_value IS NOT NULL OR p_storage_path IS NOT NULL THEN
    IF nullif(trim(p_value),'') IS NULL OR nullif(trim(p_storage_path),'') IS NULL THEN RAISE EXCEPTION 'Imagen y ruta del QR obligatorias.'; END IF;
    UPDATE public.payment_qr_config SET is_active=false,updated_by=p_actor,updated_at=now() WHERE qr_slot=p_slot AND is_active;
    INSERT INTO public.payment_qr_config(qr_slot,qr_public_url,qr_storage_path,account_label,is_active,updated_by)
      VALUES(p_slot,p_value,p_storage_path,label,active,p_actor) RETURNING to_jsonb(payment_qr_config.*) INTO result;
  ELSE
    IF current_qr.id IS NULL THEN RAISE EXCEPTION 'Sube primero una imagen para este QR.'; END IF;
    IF active AND nullif(trim(current_qr.qr_public_url),'') IS NULL THEN RAISE EXCEPTION 'Falta la imagen del QR.'; END IF;
    UPDATE public.payment_qr_config SET is_active=active,account_label=label,updated_by=p_actor,updated_at=now()
      WHERE id=current_qr.id RETURNING to_jsonb(payment_qr_config.*) INTO result;
  END IF;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.set_payment_qr_slot(uuid,text,boolean,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_payment_qr_slot(uuid,text,boolean,text,text,text) TO service_role;

-- Preserve the old server contract: legacy QR configuration now targets only QR 1.
CREATE OR REPLACE FUNCTION public.set_checkout_configuration(p_actor uuid,p_kind text,p_active boolean,
  p_value text DEFAULT NULL,p_storage_path text DEFAULT NULL,p_account_label text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
  IF p_active IS NULL THEN RAISE EXCEPTION 'Configuración inválida.'; END IF;
  IF p_kind='qr' THEN RETURN public.set_payment_qr_slot(p_actor,'qr_1',p_active,p_value,p_storage_path,p_account_label); END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND role='administrador' AND is_active) THEN RAISE EXCEPTION 'Administrador activo requerido.'; END IF;
  IF p_kind IS DISTINCT FROM 'whatsapp' OR p_active IS NULL THEN RAISE EXCEPTION 'Configuración inválida.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('checkout_config:'||p_kind,0));
  IF p_active AND (p_value IS NULL OR p_value !~ '^[0-9]{7,15}$') THEN RAISE EXCEPTION 'Número internacional inválido.'; END IF;
  UPDATE public.whatsapp_config SET is_active=false,updated_by=p_actor,updated_at=now() WHERE is_active;
  IF p_active THEN INSERT INTO public.whatsapp_config(phone_number,updated_by) VALUES(p_value,p_actor) RETURNING to_jsonb(whatsapp_config.*) INTO result; END IF;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.set_checkout_configuration(uuid,text,boolean,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_checkout_configuration(uuid,text,boolean,text,text,text) TO service_role;

CREATE FUNCTION public.report_payment_qr(p_order_id uuid,p_customer_phone text,p_qr_slot text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE payment_id uuid; payment public.payments%rowtype; config public.payment_qr_config%rowtype; selected_slot text; active_count integer;
BEGIN
  IF p_qr_slot IS NOT NULL AND p_qr_slot NOT IN ('qr_1','qr_2') THEN RAISE EXCEPTION 'QR no válido.'; END IF;
  -- Existing contract still validates identity, amount/state and reservations,
  -- serializes retries, and ONLY reports payment. All subsequent failures roll back it.
  SELECT p.id INTO payment_id FROM public.create_payment(p_order_id,p_customer_phone) p;
  SELECT * INTO payment FROM public.payments WHERE id=payment_id FOR UPDATE;
  IF payment.qr_slot IS NOT NULL THEN
    IF p_qr_slot IS NOT NULL AND p_qr_slot<>payment.qr_slot THEN RAISE EXCEPTION 'El pago ya fue reportado con otro QR. Contacta a la tienda.'; END IF;
  ELSE
    selected_slot:=p_qr_slot;
    IF selected_slot IS NULL THEN
      SELECT count(*),min(qr_slot) INTO active_count,selected_slot FROM public.payment_qr_config WHERE is_active;
      IF active_count<>1 THEN RAISE EXCEPTION 'Selecciona un QR activo para reportar tu pago.'; END IF;
    END IF;
    SELECT * INTO config FROM public.payment_qr_config WHERE qr_slot=selected_slot AND is_active FOR SHARE;
    IF config.id IS NULL OR nullif(trim(config.qr_public_url),'') IS NULL THEN RAISE EXCEPTION 'El QR seleccionado no está disponible. Actualiza el pedido.'; END IF;
    UPDATE public.payments SET qr_slot=config.qr_slot,
      qr_label=coalesce(nullif(trim(config.account_label),''),CASE config.qr_slot WHEN 'qr_1' THEN 'QR 1' ELSE 'QR 2' END),
      qr_config_id=config.id WHERE id=payment_id RETURNING * INTO payment;
  END IF;
  RETURN jsonb_build_object('id',payment.id,'amount',payment.amount,'method',payment.method,'status',payment.status,
    'order_number',(SELECT order_number FROM public.orders WHERE id=p_order_id),'qr_slot',payment.qr_slot,'qr_label',payment.qr_label);
END; $$;
REVOKE ALL ON FUNCTION public.report_payment_qr(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.report_payment_qr(uuid,text,text) TO service_role;

create or replace function public.track_order_details(
  p_customer_phone text, p_order_number bigint default null, p_order_id uuid default null
) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_order public.orders%rowtype; v_summary jsonb;
begin
  select o.* into v_order from public.orders o
  left join public.customers c on c.id = o.customer_id
  where (case when p_order_number is not null then o.order_number = p_order_number else o.id = p_order_id end)
    and o.deleted_at is null
    and (coalesce(o.guest_phone,c.phone) = trim(p_customer_phone) or coalesce(o.guest_whatsapp,c.whatsapp) = trim(p_customer_phone));
  if v_order.id is null then
    raise exception 'No encontramos un pedido con esos datos.';
  end if;
  select to_jsonb(t) into v_summary from public.track_order(v_order.order_number, trim(p_customer_phone)) t;
  return v_summary || jsonb_build_object(
    'id', v_order.id, 'reserved_until', v_order.reserved_until,
    'receipt_token', CASE WHEN EXISTS(SELECT 1 FROM public.payments p WHERE p.order_id=v_order.id AND p.status='confirmado' AND p.confirmed_at IS NOT NULL) THEN v_order.receipt_token ELSE NULL END,
    'reported_qr', (select jsonb_build_object('qr_slot',p.qr_slot,'account_label',p.qr_label,'qr_public_url',q.qr_public_url) from public.payments p join public.payment_qr_config q on q.id=p.qr_config_id where p.order_id=v_order.id order by p.created_at desc,p.id desc limit 1),
    'payment_status', (select p.status from public.payments p where p.order_id = v_order.id order by p.created_at desc, p.id desc limit 1)
  );
end;
$$;
REVOKE ALL ON FUNCTION public.track_order_details(text,bigint,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.track_order_details(text,bigint,uuid) TO service_role;
COMMIT;
