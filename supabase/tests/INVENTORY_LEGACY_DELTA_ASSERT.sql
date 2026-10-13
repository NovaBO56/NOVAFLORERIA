-- Después de aplicar exclusivamente la candidata11 al fixture sintético anterior.
BEGIN;
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('nova.security_test',true) IS DISTINCT FROM 'isolated'
 OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE full_name='TEST LEGACY DELTA ADMIN') THEN RAISE EXCEPTION 'Fixture LOCAL requerido'; END IF;
END; $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE bad uuid; good uuid; payment uuid;
BEGIN
 SELECT id INTO bad FROM public.orders WHERE idempotency_key='TEST-LEGACY-MIXED';
 SELECT id INTO good FROM public.orders WHERE idempotency_key='TEST-LEGACY-VALID';
 IF NOT(SELECT inventory_review_required FROM public.orders WHERE id=bad) OR (SELECT inventory_review_required FROM public.orders WHERE id=good) THEN RAISE EXCEPTION 'Clasificación del delta incorrecta'; END IF;
 IF (SELECT is_active OR is_available FROM public.products WHERE id='20000000-0000-4000-8000-000000000031') THEN RAISE EXCEPTION 'Producto incompleto sigue publicado'; END IF;
 -- Configurar ahora no reconstruye qué debía consumir el pedido antiguo.
 INSERT INTO public.product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES('20000000-0000-4000-8000-000000000031','20000000-0000-4000-8000-000000000020',1);
 SELECT id INTO payment FROM public.payments WHERE order_id=bad;
 BEGIN PERFORM public.confirm_payment(payment); RAISE EXCEPTION 'FALTA_GUARDIA'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%pedido antiguo requiere revisión%' THEN RAISE; END IF; END;
 IF (SELECT status FROM public.payments WHERE id=payment)<>'pendiente' OR (SELECT count(*) FROM public.inventory_movements WHERE reference_id=bad AND movement_type='salida')<>0 OR (SELECT count(*) FROM public.customers WHERE phone='00013301')<>0 THEN RAISE EXCEPTION 'Mutación parcial del pedido incompleto'; END IF;
 -- RLS puede impedir UPDATE devolviendo cero filas; el trigger también protege
 -- al servidor privilegiado. Comprobar el estado, no exigir una excepción de RLS.
 BEGIN UPDATE public.orders SET inventory_review_required=false WHERE id=bad; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%no puede omitirse%' THEN RAISE; END IF; END;
 IF NOT(SELECT inventory_review_required FROM public.orders WHERE id=bad) THEN RAISE EXCEPTION 'El cliente omitió la revisión'; END IF;
 SELECT id INTO payment FROM public.payments WHERE order_id=good;
 PERFORM public.confirm_payment(payment);
 IF (SELECT status FROM public.payments WHERE id=payment)<>'confirmado' OR (SELECT current_stock FROM public.inventory_items WHERE id='20000000-0000-4000-8000-000000000020')<>19 THEN RAISE EXCEPTION 'Regresión del pedido antiguo válido'; END IF;
 RAISE NOTICE 'PASS: pedido mixto bloqueado sin mutación, indicador protegido y pedido antiguo válido confirmado';
END; $$;
RESET ROLE;
DO $$ BEGIN
 BEGIN UPDATE public.orders SET inventory_review_required=false WHERE idempotency_key='TEST-LEGACY-MIXED'; RAISE EXCEPTION 'FALTA_GUARDIA';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%no puede omitirse%' THEN RAISE; END IF; END;
 RAISE NOTICE 'PASS: indicador también inmutable para un UPDATE privilegiado';
END; $$;
ROLLBACK;
