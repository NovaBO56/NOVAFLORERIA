-- Consulta sin escrituras. La disponibilidad no cambia los indicadores administrativos.
-- Pendiente de revisión/aplicación productiva; compatible con la cadena anterior.
BEGIN;
CREATE OR REPLACE FUNCTION public.get_product_availability(p_items jsonb, p_combine boolean DEFAULT false)
RETURNS TABLE(line_index integer, product_id uuid, available_quantity numeric, is_available boolean, is_sold_out boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH lines AS (
  SELECT (ordinality-1)::integer idx, (item->>'product_id')::uuid pid,
   coalesce((item->>'quantity')::numeric,1) qty,
   coalesce(item->'customization_option_ids','[]'::jsonb) options
  FROM jsonb_array_elements(p_items) WITH ORDINALITY t(item,ordinality)
 ), needs AS (
  SELECT l.idx,r.inventory_item_id,r.quantity FROM lines l
   JOIN product_inventory_requirements r ON r.product_id=l.pid
  UNION ALL
  SELECT l.idx,r.inventory_item_id,r.quantity FROM lines l
   CROSS JOIN LATERAL jsonb_array_elements_text(l.options) o(id)
   JOIN customization_options c ON c.id=o.id::uuid AND c.product_id=l.pid AND c.is_active
   JOIN customization_option_inventory_requirements r ON r.customization_option_id=c.id
 ), per_line AS (
  SELECT idx,inventory_item_id,sum(quantity) quantity FROM needs GROUP BY 1,2
 ), free AS (
  SELECT i.id, greatest(0,least(i.current_stock,
   coalesce((SELECT sum(remaining_quantity) FROM inventory_lots WHERE inventory_item_id=i.id),0))
   -coalesce((SELECT sum(quantity) FROM inventory_reservations
    WHERE inventory_item_id=i.id AND status='reserved' AND expires_at>statement_timestamp()),0)) quantity
  FROM inventory_items i WHERE i.id IN (SELECT inventory_item_id FROM per_line)
 ), demand AS (
  SELECT n.inventory_item_id,sum(n.quantity*l.qty) quantity
  FROM per_line n JOIN lines l ON l.idx=n.idx GROUP BY 1
 ), capacities AS (
  SELECT l.idx,l.pid,l.qty,
   EXISTS(SELECT 1 FROM product_inventory_requirements WHERE product_id=l.pid)
   AND NOT EXISTS(SELECT 1 FROM needs WHERE idx=l.idx AND (quantity<=0 OR quantity::text IN ('NaN','Infinity','-Infinity')))
   AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(l.options) o(id)
    WHERE NOT EXISTS(SELECT 1 FROM customization_options c WHERE c.id=o.id::uuid AND c.product_id=l.pid AND c.is_active)) valid,
   coalesce((SELECT min(floor(f.quantity/n.quantity)) FROM per_line n JOIN free f ON f.id=n.inventory_item_id
    WHERE n.idx=l.idx AND n.quantity>0),0) capacity,
   NOT EXISTS(SELECT 1 FROM per_line n JOIN free f ON f.id=n.inventory_item_id JOIN demand d ON d.inventory_item_id=f.id
    WHERE n.idx=l.idx AND d.quantity>f.quantity) combined_ok
  FROM lines l
 )
 SELECT c.idx,c.pid,CASE WHEN c.valid AND p.is_active AND p.is_available AND NOT p.is_sold_out THEN c.capacity ELSE 0 END,
  coalesce(p.is_active AND p.is_available AND NOT p.is_sold_out AND c.valid AND c.qty>0
   AND c.capacity>=c.qty AND (NOT p_combine OR c.combined_ok),false),
  coalesce(p.is_sold_out,false) OR (c.valid AND c.capacity<c.qty)
 FROM capacities c LEFT JOIN products p ON p.id=c.pid ORDER BY c.idx;
$$;
REVOKE ALL ON FUNCTION public.get_product_availability(jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_availability(jsonb,boolean) TO service_role;
COMMENT ON FUNCTION public.get_product_availability(jsonb,boolean) IS
 'Lectura privada para APIs públicas: receta, lotes, reservas vigentes y demanda compartida. create_order conserva la validación transaccional definitiva.';
-- Ampliar únicamente la lista de rutas del limitador existente, conservando
-- su validación, bloqueo, cuotas y ACL. Fallar si cambia el contrato esperado.
DO $$ DECLARE definition text; changed text;
BEGIN
 definition:=pg_get_functiondef('public.check_rate_limit(text,text,integer,integer)'::regprocedure);
 IF position('''cartAvailability''' IN definition)=0 THEN
  changed:=replace(definition,'''trackOrder'',''orderReceipt''','''cartAvailability'',''trackOrder'',''orderReceipt''');
  IF changed=definition THEN RAISE EXCEPTION 'No se encontró la lista de rutas del limitador esperado.'; END IF;
  EXECUTE changed;
 END IF;
END; $$;
COMMIT;
