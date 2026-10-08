import fs from 'node:fs';
const root='supabase/baseline-candidate';
const defs=JSON.parse(fs.readFileSync(`${root}/BACKEND_ORIGINAL_DEFINITIONS.json`,'utf8'));
const find=n=>{const f=defs.find(f=>f.name===n);if(!f)throw Error(n);return f.sql;};
const replace=(s,a,b)=>{if(!s.includes(a))throw Error('Missing replacement '+a.slice(0,70));return s.replace(a,b);};
const final=[];
const add=(name,sql)=>final.push({name,sql});
add('validate_inventory_movement_actor',`CREATE OR REPLACE FUNCTION public.validate_inventory_movement_actor() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
 IF NEW.created_by IS NULL AND NOT (NEW.movement_type='salida' AND NEW.reference_type='order' AND
  EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.reference_id AND order_type='online' AND status='pendiente_pago'
   AND subtotal>0 AND total=0 AND discount_total=subtotal)) THEN
  RAISE EXCEPTION 'Actor obligatorio salvo consumo automático de pedido gratuito válido.';
 END IF;
 RETURN NEW;
END;
$function$;`);
add('protect_order_request_contract',`CREATE OR REPLACE FUNCTION public.protect_order_request_contract() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
 IF NEW.request_contract IS DISTINCT FROM OLD.request_contract THEN
  RAISE EXCEPTION 'El contrato original del pedido es inmutable.';
 END IF;
 RETURN NEW;
END;
$function$;`);
add('consume_order_reservations',`CREATE OR REPLACE FUNCTION public.consume_order_reservations(p_order_id uuid,p_actor_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE o public.orders%rowtype; r record; l record; remaining numeric; take numeric; checked_at timestamptz;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF o.id IS NULL OR o.status <> 'pendiente_pago' THEN RAISE EXCEPTION 'El pedido ya no admite confirmación.'; END IF;
 IF p_actor_id IS NULL AND NOT (o.order_type='online' AND o.subtotal>0 AND o.total=0 AND o.discount_total=o.subtotal) THEN RAISE EXCEPTION 'Consumo automático solo para pedido gratuito válido.'; END IF;
 PERFORM id FROM public.payments WHERE order_id=p_order_id ORDER BY id FOR UPDATE;
 PERFORM id FROM public.inventory_reservations WHERE order_id=p_order_id ORDER BY inventory_item_id,id FOR UPDATE;
 PERFORM i.id FROM public.inventory_items i WHERE i.id IN
  (SELECT inventory_item_id FROM public.inventory_reservations WHERE order_id=p_order_id) ORDER BY i.id FOR UPDATE;
 PERFORM locked_lot.id FROM public.inventory_lots locked_lot WHERE locked_lot.inventory_item_id IN
  (SELECT inventory_item_id FROM public.inventory_reservations WHERE order_id=p_order_id)
  ORDER BY locked_lot.inventory_item_id,locked_lot.received_at,locked_lot.created_at,locked_lot.id FOR UPDATE;
 checked_at:=clock_timestamp();
 IF o.reserved_until IS NOT NULL AND o.reserved_until<=checked_at THEN RAISE EXCEPTION 'La reserva del pedido venció. No se puede confirmar.'; END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=p_order_id AND (status<>'reserved' OR expires_at<=checked_at)) THEN
  RAISE EXCEPTION 'La reserva de inventario venció o fue liberada.';
 END IF;
 FOR r IN SELECT * FROM public.inventory_reservations WHERE order_id=p_order_id ORDER BY inventory_item_id,id LOOP
  IF (SELECT current_stock FROM public.inventory_items WHERE id=r.inventory_item_id)<r.quantity THEN RAISE EXCEPTION 'Inconsistencia de inventario: stock insuficiente.'; END IF;
  remaining:=r.quantity;
  FOR l IN SELECT * FROM public.inventory_lots WHERE inventory_item_id=r.inventory_item_id AND remaining_quantity>0 ORDER BY received_at,created_at,id LOOP
   EXIT WHEN remaining<=0;
   take:=least(l.remaining_quantity,remaining);
   UPDATE public.inventory_lots SET remaining_quantity=remaining_quantity-take WHERE id=l.id;
   INSERT INTO public.inventory_movements(inventory_item_id,lot_id,movement_type,quantity,reference_type,reference_id,created_by)
    VALUES(r.inventory_item_id,l.id,'salida',take,'order',p_order_id,p_actor_id);
   remaining:=remaining-take;
  END LOOP;
  IF remaining>0 THEN RAISE EXCEPTION 'Inconsistencia de inventario: no quedan lotes suficientes.'; END IF;
  UPDATE public.inventory_items SET current_stock=current_stock-r.quantity,updated_at=checked_at WHERE id=r.inventory_item_id;
  UPDATE public.inventory_reservations SET status='consumed',released_at=checked_at WHERE id=r.id;
 END LOOP;
END;
$function$;`);
add('release_expired_reservations',`CREATE OR REPLACE FUNCTION public.release_expired_reservations(p_inventory_item_id uuid DEFAULT NULL::uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE oid uuid; affected integer:=0; n integer; checked_at timestamptz;
BEGIN
 FOR oid IN SELECT DISTINCT order_id FROM public.inventory_reservations WHERE status='reserved' AND expires_at<=clock_timestamp()
  AND (p_inventory_item_id IS NULL OR inventory_item_id=p_inventory_item_id) ORDER BY order_id LOOP
  PERFORM id FROM public.orders WHERE id=oid FOR UPDATE;
  PERFORM id FROM public.payments WHERE order_id=oid ORDER BY id FOR UPDATE;
  PERFORM id FROM public.inventory_reservations WHERE order_id=oid ORDER BY inventory_item_id,id FOR UPDATE;
  checked_at:=clock_timestamp();
  IF EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND status='pendiente_pago') AND
   (EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND reserved_until<=checked_at) OR
    EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=oid AND status='reserved' AND expires_at<=checked_at)) THEN
   UPDATE public.inventory_reservations SET status='released',released_at=checked_at WHERE order_id=oid AND status='reserved';
   GET DIAGNOSTICS n=ROW_COUNT; affected:=affected+n;
   UPDATE public.orders SET status='cancelado',cancelled_at=checked_at,cancellation_reason='Reserva de inventario vencida.',updated_at=checked_at WHERE id=oid AND status='pendiente_pago';
  END IF;
 END LOOP;
 RETURN affected;
END;
$function$;`);
add('confirm_payment',`CREATE OR REPLACE FUNCTION public.confirm_payment(p_payment_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE actor uuid:=auth.uid(); o public.orders%rowtype; p public.payments%rowtype;
BEGIN
 IF actor IS NULL OR NOT public.is_employee_or_admin() THEN RAISE EXCEPTION 'No tienes permisos para confirmar pagos.'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=(SELECT order_id FROM public.payments WHERE id=p_payment_id) FOR UPDATE;
 PERFORM id FROM public.payments WHERE order_id=o.id ORDER BY id FOR UPDATE;
 SELECT * INTO p FROM public.payments WHERE id=p_payment_id;
 IF p.id IS NULL THEN RAISE EXCEPTION 'El pago no existe.'; END IF;
 IF p.status<>'pendiente' THEN RAISE EXCEPTION 'Este pago ya fue procesado (estado actual: %).',p.status; END IF;
 IF o.deleted_at IS NOT NULL OR o.status<>'pendiente_pago' OR o.order_type<>'online' THEN RAISE EXCEPTION 'El pedido ya no admite confirmación de pago.'; END IF;
 IF o.total<=0 OR o.total::text='NaN' OR p.amount IS DISTINCT FROM o.total THEN RAISE EXCEPTION 'El monto del pago no coincide con el pedido.'; END IF;
 PERFORM public.consume_order_reservations(o.id,actor);
 UPDATE public.payments SET status='confirmado',confirmed_by=actor,confirmed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=p.id;
 UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=o.id;
END;
$function$;`);
let order=find('create_order');
order=replace(order,'  v_existing_order_id uuid;','  v_existing_order_id uuid;\n  v_contract jsonb;\n  v_existing_contract jsonb;');
const idStart=order.indexOf('  if p_idempotency_key is not null then');const idEnd=order.indexOf('\n\n\n  -- ===',idStart);
order=order.slice(0,idStart)+order.slice(idEnd);
const beforeBusiness=order.indexOf('  select\n    gbs.is_open');
const contract=`  IF nullif(trim(p_idempotency_key),'') IS NULL OR length(p_idempotency_key)>100 OR p_customer_name IS NULL OR nullif(trim(p_customer_name),'') IS NULL
     OR length(trim(coalesce(p_customer_phone,''))) NOT BETWEEN 6 AND 30 THEN RAISE EXCEPTION 'Contrato básico de pedido inválido.'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x WHERE jsonb_typeof(x)<>'object' OR x->>'product_id' IS NULL OR x->>'quantity' IS NULL
   OR (x ? 'customization_option_ids' AND jsonb_typeof(x->'customization_option_ids')<>'array')) THEN RAISE EXCEPTION 'Líneas de pedido inválidas.'; END IF;
  SELECT jsonb_build_object('name',trim(p_customer_name),'phone',trim(p_customer_phone),'whatsapp',nullif(trim(p_customer_whatsapp),''),
    'message',nullif(trim(p_customer_message),''),'promotion',p_promotion_id,'items',jsonb_agg(line ORDER BY line::text)) INTO v_contract
  FROM (SELECT jsonb_build_object('product_id',(x->>'product_id')::uuid,'quantity',(x->>'quantity')::numeric(12,3),
   'message',nullif(trim(x->>'message'),''),'note',nullif(trim(x->>'note'),''),
   'options',(SELECT coalesce(jsonb_agg(option_id::uuid ORDER BY option_id::uuid),'[]'::jsonb) FROM jsonb_array_elements_text(coalesce(x->'customization_option_ids','[]'::jsonb)) option_id)) line
   FROM jsonb_array_elements(p_items) x) lines;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,37007));
  SELECT id,request_contract INTO v_existing_order_id,v_existing_contract FROM public.orders WHERE idempotency_key=p_idempotency_key;
  IF v_existing_order_id IS NOT NULL THEN
   IF v_existing_contract IS NULL THEN RAISE EXCEPTION 'Clave antigua sin contrato verificable; requiere revisión.'; END IF;
   IF v_existing_contract IS DISTINCT FROM v_contract THEN RAISE EXCEPTION 'Reutilización inválida de clave de idempotencia: contrato diferente.'; END IF;
   RETURN v_existing_order_id;
  END IF;
\n`;
order=order.slice(0,beforeBusiness)+contract+order.slice(beforeBusiness);
order=order.replace(/perform public\.release_expired_reservations\(\s*v_inv_item_id::uuid\s*\);/g,'');
const invLoop='  for v_inv_item_id in\n    select jsonb_object_keys(v_item_needs)';
order=replace(order,invLoop,'  perform public.release_expired_reservations(NULL);\n  v_reserved_until:=clock_timestamp()+interval \'30 minutes\';\n'+invLoop);
order=order.replaceAll('select jsonb_object_keys(v_item_needs)','select key from jsonb_object_keys(v_item_needs) key order by key::uuid');
order=replace(order,'  return v_order_id;',`  UPDATE public.orders SET request_contract=v_contract WHERE id=v_order_id;
  IF (SELECT total FROM public.orders WHERE id=v_order_id)=0 THEN
   PERFORM public.consume_order_reservations(v_order_id,NULL);
   UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=v_order_id;
  END IF;
  return v_order_id;`);
// Contract is inserted with the order; subsequent changes are forbidden.
order=replace(order,'    idempotency_key,\n    reserved_until','    idempotency_key,\n    request_contract,\n    reserved_until');
order=replace(order,'    p_idempotency_key,\n    v_reserved_until','    p_idempotency_key,\n    v_contract,\n    v_reserved_until');
order=order.replace('  UPDATE public.orders SET request_contract=v_contract WHERE id=v_order_id;\n','');
add('create_order',order);
let physical=find('create_physical_sale');physical=physical.replace('    perform public.release_expired_reservations(v_inv_item_id::uuid);','');
physical=replace(physical,'  for v_inv_item_id in select jsonb_object_keys(v_item_needs)','  perform public.release_expired_reservations(NULL);\n  for v_inv_item_id in select jsonb_object_keys(v_item_needs)');
physical=physical.replaceAll('select jsonb_object_keys(v_item_needs)','select key from jsonb_object_keys(v_item_needs) key order by key::uuid').replace('order by il.received_at asc, il.created_at asc','order by il.received_at asc, il.created_at asc, il.id asc');add('create_physical_sale',physical);
let pay=fs.readFileSync(`${root}/CREATE_PAYMENT_FINAL.sql`,'utf8').replace(/\r\n/g,'\n').replaceAll('<= now()','<= clock_timestamp()').replace('FOR UPDATE OF o, c','FOR UPDATE OF o');
pay=replace(pay,'  IF EXISTS (SELECT 1 FROM public.inventory_reservations',`  PERFORM p.id FROM public.payments p WHERE p.order_id=p_order_id ORDER BY p.id FOR UPDATE;
  PERFORM ir.id FROM public.inventory_reservations ir WHERE ir.order_id=p_order_id ORDER BY ir.inventory_item_id,ir.id FOR UPDATE;
  IF v_order.reserved_until IS NOT NULL AND v_order.reserved_until<=clock_timestamp() THEN RAISE EXCEPTION 'La reserva del pedido venció.'; END IF;
  IF EXISTS (SELECT 1 FROM public.inventory_reservations`);add('create_payment',pay);
let reject=find('reject_payment');reject=replace(reject,'  select id, order_id, status into v_payment',`  perform o.id from public.orders o where o.id=(select order_id from public.payments where id=p_payment_id) for update;
  perform id from public.payments where order_id=(select order_id from public.payments where id=p_payment_id) order by id for update;
  perform id from public.inventory_reservations where order_id=(select order_id from public.payments where id=p_payment_id) order by inventory_item_id,id for update;
  select id, order_id, status into v_payment`);add('reject_payment',reject);
for(const name of ['cancel_order','create_sale_return']){
 let s=find(name);const position=s.indexOf('    for v_movement in');
 s=s.slice(0,position)+`    perform id from public.payments where order_id=p_order_id order by id for update;
    perform id from public.inventory_reservations where order_id=p_order_id order by inventory_item_id,id for update;
    perform i.id from public.inventory_items i where i.id in (select inventory_item_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by i.id for update;
    perform l.id from public.inventory_lots l where l.id in (select lot_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by l.inventory_item_id,l.received_at,l.created_at,l.id for update;
`+s.slice(position);add(name,s);
}
let consume=find('consume_product_inventory').replaceAll('where product_id = p_product_id','where product_id = p_product_id\n    order by inventory_item_id').replace('order by received_at asc, created_at asc','order by received_at asc, created_at asc, id asc');add('consume_product_inventory',consume);
let entry=find('handle_inventory_entry');entry=replace(entry,'begin\n  insert into',`begin
  perform id from public.inventory_items where id=new.inventory_item_id for update;
  insert into`);add('handle_inventory_entry',entry);
fs.writeFileSync(`${root}/BACKEND_FINAL_DEFINITIONS.json`,JSON.stringify(final,null,2)+'\n');
const schema=`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_contract jsonb;
ALTER TABLE public.inventory_movements ALTER COLUMN created_by DROP NOT NULL;
COMMENT ON COLUMN public.orders.request_contract IS 'Contrato normalizado original e inmutable; NULL identifica pedidos legacy no verificables. No se publica por RPC de seguimiento.';`;
const trigger=`CREATE OR REPLACE TRIGGER protect_order_request_contract BEFORE UPDATE OF request_contract ON public.orders FOR EACH ROW EXECUTE FUNCTION public.protect_order_request_contract();
CREATE OR REPLACE TRIGGER validate_inventory_movement_actor BEFORE INSERT OR UPDATE ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_movement_actor();`;
const acl=`ALTER FUNCTION public.consume_order_reservations(uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.consume_order_reservations(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.consume_order_reservations(uuid,uuid) TO service_role;
ALTER FUNCTION public.protect_order_request_contract() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.protect_order_request_contract() FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.validate_inventory_movement_actor() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.validate_inventory_movement_actor() FROM PUBLIC,anon,authenticated,service_role;`;
fs.writeFileSync(`${root}/037_backend_concurrency_zero_total.sql`,`-- CANDIDATA LOCAL; no historial, no datos productivos, no 035.\nBEGIN;\n${schema}\n${final.map(f=>f.sql).join('\n\n')}\n${trigger}\n${acl}\nCOMMIT;\n`);
fs.writeFileSync(`${root}/BACKEND_SCHEMA_FINAL.sql`,schema+'\n');
fs.writeFileSync(`${root}/BACKEND_TRIGGER_FINAL.sql`,trigger+'\n');
console.log(final.map(f=>f.name));
