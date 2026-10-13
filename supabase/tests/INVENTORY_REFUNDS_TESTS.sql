-- LOCAL desechable vacío, once migraciones + seed. Todo revierte (salvo secuencias).
BEGIN;
SET LOCAL search_path=public,extensions,pg_catalog;
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('nova.security_test',true) IS DISTINCT FROM 'isolated'
 OR EXISTS(SELECT 1 FROM profiles) OR EXISTS(SELECT 1 FROM orders) THEN RAISE EXCEPTION 'Solo laboratorio vacío con opt-in'; END IF;
END; $$;
CREATE FUNCTION pg_temp.check_result(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',label; END IF; RAISE NOTICE 'PASS: %',label; END; $$;
INSERT INTO auth.users(id,raw_user_meta_data) VALUES('10000000-0000-4000-8000-000000000001','{"full_name":"TEST INTEGRITY ADMIN"}');
UPDATE profiles SET role='administrador',is_active=true WHERE id='10000000-0000-4000-8000-000000000001';
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
INSERT INTO inventory_items(id,name,item_type) VALUES('10000000-0000-4000-8000-000000000020','TEST INTEGRITY STOCK','flor');
INSERT INTO inventory_entries(inventory_item_id,quantity,created_by) VALUES
 ('10000000-0000-4000-8000-000000000020',20,'10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000020',30,'10000000-0000-4000-8000-000000000001');
INSERT INTO products(id,name,price) VALUES('10000000-0000-4000-8000-000000000030','TEST INTEGRITY 90',90),('10000000-0000-4000-8000-000000000031','TEST INTEGRITY 200',200);
DO $$ BEGIN
 PERFORM pg_temp.check_result(NOT(SELECT is_active OR is_available FROM products WHERE id='10000000-0000-4000-8000-000000000030'),'nuevo producto inactivo');
 BEGIN
  UPDATE products SET is_active=true WHERE id='10000000-0000-4000-8000-000000000030';
  RAISE EXCEPTION 'FALTA_GUARDIA';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%consumo de inventario válido%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_result(NOT(SELECT is_active FROM products WHERE id='10000000-0000-4000-8000-000000000030'),'activación sin receta rechazada sin mutación');
END; $$;
INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES
 ('10000000-0000-4000-8000-000000000030','10000000-0000-4000-8000-000000000020',1),
 ('10000000-0000-4000-8000-000000000031','10000000-0000-4000-8000-000000000020',2);
UPDATE products SET is_active=true,is_available=true WHERE id IN ('10000000-0000-4000-8000-000000000030','10000000-0000-4000-8000-000000000031');
DO $$ BEGIN
 BEGIN DELETE FROM product_inventory_requirements WHERE product_id='10000000-0000-4000-8000-000000000030'; RAISE EXCEPTION 'FALTA_GUARDIA';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%consumo de inventario válido%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_result((SELECT count(*)=1 FROM product_inventory_requirements WHERE product_id='10000000-0000-4000-8000-000000000030'),'no eliminar última receta activa');
END; $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.assert_product_recipe('10000000-0000-4000-8000-000000000030'); RAISE EXCEPTION 'Helper público'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM sales_ledger; RAISE EXCEPTION 'Libro público'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ DECLARE session uuid; sale90 uuid; sale200 uuid; physical uuid; money uuid; result uuid; again uuid; cash numeric;
BEGIN
 session:=public.open_cash_session((SELECT id FROM cash_registers WHERE is_active LIMIT 1),20);
 SELECT id INTO sale90 FROM public.create_physical_sale('[{"product_id":"10000000-0000-4000-8000-000000000030","quantity":1}]',NULL,NULL,NULL,NULL,'efectivo');
 PERFORM pg_temp.check_result((SELECT current_stock=49 FROM inventory_items WHERE id='10000000-0000-4000-8000-000000000020'),'venta consume una unidad');
 PERFORM pg_temp.check_result((SELECT sum(amount)=90 FROM sales_ledger WHERE kind='sale' AND order_id=sale90),'venta bruta90');
 PERFORM pg_temp.check_result((SELECT count(*)=0 FROM sales_ledger WHERE kind='refund' AND order_id=sale90),'sin reintegro neto90');
 result:=public.create_sale_return(sale90,'devolucion',90,'TEST devolución90','10000000-0000-4000-8000-000000000090');
 again:=public.create_sale_return(sale90,'devolucion',90,'TEST devolución90','10000000-0000-4000-8000-000000000090');
 PERFORM pg_temp.check_result(result=again,'retry devuelve mismo registro');
 PERFORM pg_temp.check_result((SELECT current_stock=50 FROM inventory_items WHERE id='10000000-0000-4000-8000-000000000020'),'retorno físico exactamente una vez');
 PERFORM pg_temp.check_result((SELECT sum(CASE WHEN kind='sale' THEN amount ELSE -amount END)=0 FROM sales_ledger WHERE order_id=sale90),'bruto90 reintegro90 neto0');
 PERFORM pg_temp.check_result((SELECT total=90 AND status='finalizado' FROM orders WHERE id=sale90),'venta original intacta');
 PERFORM pg_temp.check_result((SELECT count(*)=1 FROM cash_movements WHERE order_id=sale90 AND movement_type='devolucion'),'caja reintegro una vez');
 BEGIN PERFORM public.create_sale_return(sale90,'devolucion',90,'TEST distinto','10000000-0000-4000-8000-000000000090'); RAISE EXCEPTION 'FALTA_GUARDIA';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%otra operación%' THEN RAISE; END IF; END;
 SELECT id INTO sale200 FROM public.create_physical_sale('[{"product_id":"10000000-0000-4000-8000-000000000031","quantity":1}]',NULL,NULL,NULL,NULL,'qr');
 result:=public.create_sale_return(sale200,'reintegro',50,'TEST parcial50','10000000-0000-4000-8000-000000000091');
 PERFORM public.create_sale_return(sale200,'reintegro',50,'TEST parcial50','10000000-0000-4000-8000-000000000091');
 PERFORM pg_temp.check_result((SELECT sum(CASE WHEN kind='sale' THEN amount ELSE -amount END)=150 FROM sales_ledger WHERE order_id=sale200),'parcial200/50/neto150');
 PERFORM pg_temp.check_result((SELECT current_stock=48 FROM inventory_items WHERE id='10000000-0000-4000-8000-000000000020'),'solo reintegro no aumenta stock');
 PERFORM pg_temp.check_result((SELECT payment_method='qr' FROM cash_movements WHERE order_id=sale200 AND movement_type='devolucion'),'reintegro QR conserva método');
 SELECT id INTO physical FROM public.create_physical_sale('[{"product_id":"10000000-0000-4000-8000-000000000030","quantity":1}]',NULL,NULL,NULL,NULL,'efectivo');
 result:=public.create_sale_return(physical,'retorno_fisico',0,'TEST solo inventario','10000000-0000-4000-8000-000000000092');
 PERFORM public.create_sale_return(physical,'retorno_fisico',0,'TEST solo inventario','10000000-0000-4000-8000-000000000092');
 PERFORM pg_temp.check_result((SELECT current_stock=48 FROM inventory_items WHERE id='10000000-0000-4000-8000-000000000020'),'retorno solo físico repone una vez');
 PERFORM pg_temp.check_result((SELECT count(*)=0 FROM sales_ledger WHERE kind='refund' AND order_id=physical),'retorno físico sin reintegro no reduce neto');
 PERFORM pg_temp.check_result((SELECT count(*)=0 FROM cash_movements WHERE order_id=physical AND movement_type='devolucion'),'retorno físico no modifica dinero');
 SELECT id INTO money FROM public.create_physical_sale('[{"product_id":"10000000-0000-4000-8000-000000000030","quantity":1}]',NULL,NULL,NULL,NULL,'qr');
 PERFORM public.create_sale_return(money,'reintegro',30,'TEST solo dinero','10000000-0000-4000-8000-000000000093');
 PERFORM pg_temp.check_result((SELECT current_stock=47 FROM inventory_items WHERE id='10000000-0000-4000-8000-000000000020'),'reintegro sin retorno físico no repone');
 PERFORM pg_temp.check_result((SELECT sum(remaining_quantity)=47 FROM inventory_lots WHERE inventory_item_id='10000000-0000-4000-8000-000000000020'),'lotes conciliados47');
 PERFORM pg_temp.check_result((SELECT sum(CASE WHEN kind='sale' THEN amount ELSE 0 END)=470 AND sum(CASE WHEN kind='refund' THEN amount ELSE 0 END)=170 FROM sales_ledger),'totales brutos470/reintegros170/netos300');
 result:=public.create_sale_return(money,'reintegro',1,'TEST adaptador anterior');
 again:=public.create_sale_return(money,'reintegro',1.0,'TEST adaptador anterior');
 PERFORM pg_temp.check_result(result=again,'adaptador anterior idempotente y decimal canónico');
 PERFORM pg_temp.check_result((SELECT sum(amount)=31 FROM sale_returns WHERE order_id=money),'adaptador no duplica reintegro');
 PERFORM public.close_cash_session(session,110,'TEST cierre');
 PERFORM pg_temp.check_result((SELECT expected_amount=110 AND difference_amount=0 FROM cash_sessions WHERE id=session),'cierre efectivo110; QR no altera efectivo');
END; $$;
RESET ROLE;
ROLLBACK;
