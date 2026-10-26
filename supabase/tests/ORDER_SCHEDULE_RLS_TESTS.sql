-- Real PostgreSQL RLS regression. Use scripts/qa-order-schedule-rls-local.mjs.
-- Every fixture, audit row and notification rolls back. Explicit negative order
-- numbers avoid nextval(), whose increments would survive ROLLBACK.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout = '20s';
SET LOCAL lock_timeout = '3s';
DO $$
BEGIN
 IF session_user <> 'postgres' OR current_user <> 'postgres'
    OR inet_client_addr() IS NOT NULL
    OR current_setting('nova.security_test', true) IS DISTINCT FROM 'local-order-schedule'
    OR coalesce(current_setting('nova.schedule_test_run', true), '') !~ '^qa-order-schedule-rls-[0-9a-f-]{36}$'
 THEN RAISE EXCEPTION 'Use the explicitly guarded LOCAL order schedule runner.'; END IF;
END; $$;

CREATE TEMP TABLE schedule_checks(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.check_schedule(ok boolean, label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
 IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
 INSERT INTO pg_temp.schedule_checks VALUES(label);
END; $$;
CREATE FUNCTION pg_temp.expect_schedule_error(statement text, expected text, label text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE caught text;
BEGIN
 BEGIN EXECUTE statement;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS caught = RETURNED_SQLSTATE;
  IF caught <> expected THEN RAISE; END IF;
 END;
 PERFORM pg_temp.check_schedule(caught = expected, label);
END; $$;

CREATE TEMP TABLE schedule_context(
 admin_id uuid DEFAULT gen_random_uuid(), employee_id uuid DEFAULT gen_random_uuid(),
 inactive_id uuid DEFAULT gen_random_uuid(), unknown_id uuid DEFAULT gen_random_uuid(),
 order_id uuid DEFAULT gen_random_uuid(), finished_id uuid DEFAULT gen_random_uuid(),
 physical_id uuid DEFAULT gen_random_uuid(), expired_id uuid DEFAULT gen_random_uuid(),
 missing_id uuid DEFAULT gen_random_uuid(), planned timestamptz, outside_hours timestamptz,
 number_base bigint, run_tag text DEFAULT current_setting('nova.schedule_test_run')
);
INSERT INTO schedule_context DEFAULT VALUES;
DO $$
DECLARE chosen record; invalid record; c pg_temp.schedule_context%rowtype;
BEGIN
 SELECT (current_timestamp AT TIME ZONE 'America/La_Paz')::date + n AS day, h.opens_at, h.closes_at
 INTO chosen FROM generate_series(1,14) n
 JOIN public.business_hours h ON h.day_of_week = extract(dow FROM (current_timestamp AT TIME ZONE 'America/La_Paz')::date+n)::integer
 WHERE NOT h.is_closed AND h.opens_at IS NOT NULL AND h.closes_at IS NOT NULL AND h.opens_at <= h.closes_at
 ORDER BY n LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Fixture needs an existing open day within 14 days; settings are never changed.'; END IF;
 SELECT (current_timestamp AT TIME ZONE 'America/La_Paz')::date+n AS day, h.opens_at, h.closes_at, h.is_closed
 INTO invalid FROM generate_series(1,14) n
 JOIN public.business_hours h ON h.day_of_week = extract(dow FROM (current_timestamp AT TIME ZONE 'America/La_Paz')::date+n)::integer
 WHERE h.is_closed OR h.opens_at > time '00:00' OR h.closes_at < time '23:59:59'
 ORDER BY n LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Fixture needs an existing closed time; settings are never changed.'; END IF;
 UPDATE schedule_context SET
  planned = (chosen.day + chosen.opens_at + (chosen.closes_at-chosen.opens_at)/2) AT TIME ZONE 'America/La_Paz',
  outside_hours = (CASE WHEN invalid.is_closed THEN invalid.day + time '12:00'
    WHEN invalid.opens_at > time '00:00' THEN invalid.day + invalid.opens_at - interval '1 second'
    ELSE invalid.day + invalid.closes_at + interval '1 second' END) AT TIME ZONE 'America/La_Paz',
  number_base = least((SELECT coalesce(min(order_number),0) FROM public.orders),0)-10;
 SELECT * INTO c FROM schedule_context;
 INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  (c.admin_id,c.run_tag||'-admin@example.invalid','{"full_name":"QA schedule admin"}'),
  (c.employee_id,c.run_tag||'-employee@example.invalid','{"full_name":"QA schedule employee"}'),
  (c.inactive_id,c.run_tag||'-inactive@example.invalid','{"full_name":"QA schedule inactive"}');
 UPDATE public.profiles SET role=CASE WHEN id=c.admin_id THEN 'administrador' ELSE 'empleado' END,
  is_active = id <> c.inactive_id WHERE id IN(c.admin_id,c.employee_id,c.inactive_id);
 INSERT INTO public.orders(id,order_number,order_type,status,subtotal,discount_total,total,guest_name,guest_phone,customer_message,reserved_until,idempotency_key) VALUES
  (c.order_id,c.number_base,'online','pendiente_pago',105,10,95,'QA schedule customer','70000991','Método: Retiro en tienda',now()+interval '1 hour',c.run_tag||'-main'),
  (c.finished_id,c.number_base-1,'online','finalizado',105,10,95,'QA finished customer','70000992',NULL,NULL,c.run_tag||'-finished'),
  (c.physical_id,c.number_base-2,'fisica','finalizado',105,10,95,'QA physical customer','70000993',NULL,NULL,c.run_tag||'-physical'),
  (c.expired_id,c.number_base-3,'online','pendiente_pago',105,10,95,'QA expired customer','70000994',NULL,now()-interval '1 hour',c.run_tag||'-expired');
 PERFORM pg_temp.check_schedule((SELECT prosecdef AND proconfig @> ARRAY['search_path=public, pg_temp'] FROM pg_proc WHERE oid='public.set_order_schedule(uuid,timestamptz,text,integer,boolean)'::regprocedure),'RPC uses controlled definer and fixed search path');
 PERFORM pg_temp.check_schedule(NOT has_function_privilege('anon','public.set_order_schedule(uuid,timestamptz,text,integer,boolean)','EXECUTE'),'anon has no scheduling RPC ACL');
END; $$;
GRANT SELECT ON schedule_context TO authenticated,anon,service_role;
GRANT INSERT,SELECT ON schedule_checks TO authenticated,anon,service_role;

-- Claims alone are insufficient: the actual SQL role must be authenticated.
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM set_config('request.jwt.claim.sub',c.admin_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',c.admin_id,'role','authenticated')::text,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE c pg_temp.schedule_context%rowtype; affected integer;
BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM pg_temp.check_schedule(current_user='authenticated' AND auth.uid()=c.admin_id,'admin uses real authenticated SQL role and identity');
 PERFORM pg_temp.check_schedule((SELECT count(*)=1 FROM public.orders WHERE id=c.order_id),'admin can read the order before scheduling');
 BEGIN UPDATE public.orders SET total=0 WHERE id=c.order_id; GET DIAGNOSTICS affected=ROW_COUNT;
 EXCEPTION WHEN insufficient_privilege THEN affected:=0; END;
 PERFORM pg_temp.check_schedule(affected=0 AND (SELECT total=95 FROM public.orders WHERE id=c.order_id),'direct table amount update remains denied');
 BEGIN UPDATE public.orders SET scheduled_for=c.planned,schedule_status='proposed',schedule_revision=1 WHERE id=c.order_id; GET DIAGNOSTICS affected=ROW_COUNT;
 EXCEPTION WHEN insufficient_privilege THEN affected:=0; END;
 PERFORM pg_temp.check_schedule(affected=0 AND (SELECT schedule_revision=0 FROM public.orders WHERE id=c.order_id),'direct table schedule update remains denied');
 PERFORM pg_temp.check_schedule(public.set_order_schedule(c.order_id,c.planned,'proposed',0,false)=1,'admin proposal succeeds through RPC under RLS');
 PERFORM pg_temp.check_schedule((SELECT scheduled_for=c.planned AND schedule_status='proposed' AND NOT schedule_client_confirmed AND schedule_revision=1 AND schedule_updated_by=c.admin_id AND schedule_updated_at IS NOT NULL FROM public.orders WHERE id=c.order_id),'proposal stores exact instant revision and real actor');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''confirmed'',1,false)',c.order_id,c.planned),'P0001','confirmation requires explicit customer acknowledgement');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',1,true)',c.order_id,c.planned),'P0001','proposal cannot claim customer confirmation');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',1,false)',c.missing_id,c.planned),'P0002','nonexistent order returns the real missing order error');
END; $$;
RESET ROLE;
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM set_config('request.jwt.claim.sub',c.employee_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',c.employee_id,'role','authenticated')::text,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE c pg_temp.schedule_context%rowtype;
BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM pg_temp.check_schedule(current_user='authenticated' AND auth.uid()=c.employee_id,'employee uses real authenticated SQL role and identity');
 PERFORM pg_temp.check_schedule(public.set_order_schedule(c.order_id,c.planned,'confirmed',1,true)=2,'active employee confirms existing proposal under RLS');
 PERFORM pg_temp.check_schedule((SELECT scheduled_for=c.planned AND schedule_status='confirmed' AND schedule_client_confirmed AND schedule_revision=2 AND schedule_updated_by=c.employee_id FROM public.orders WHERE id=c.order_id),'confirmation stores exact instant revision and employee actor');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',1,false)',c.order_id,c.planned),'40001','stale optimistic revision is rejected');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',2,false)',c.order_id,now()-interval '1 day'),'P0001','past schedule is rejected');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',2,false)',c.order_id,now()+interval '181 days'),'P0001','schedule beyond 180 days is rejected');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',2,false)',c.order_id,c.outside_hours),'P0001','configured closed time is rejected without editing business hours');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',0,false)',c.finished_id,c.planned),'P0001','finalized online order cannot be rescheduled');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',0,false)',c.physical_id,c.planned),'P0001','physical sale cannot be scheduled');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',0,false)',c.expired_id,c.planned),'P0001','expired unpaid order cannot be scheduled');
 PERFORM pg_temp.check_schedule((SELECT schedule_revision=2 AND schedule_status='confirmed' AND scheduled_for=c.planned FROM public.orders WHERE id=c.order_id),'failed changes leave the confirmed schedule intact');
 PERFORM pg_temp.check_schedule((SELECT status='pendiente_pago' AND subtotal=105 AND discount_total=10 AND total=95 AND customer_id IS NULL FROM public.orders WHERE id=c.order_id),'scheduling preserves operational payment state amounts and customer link');
END; $$;
RESET ROLE;
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM set_config('request.jwt.claim.sub',c.inactive_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',c.inactive_id,'role','authenticated')::text,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',2,false)',c.order_id,c.planned),'42501','inactive employee is denied by the actual RPC');
 PERFORM pg_temp.check_schedule((SELECT count(*)=0 FROM public.orders WHERE id=c.order_id),'inactive employee cannot read the order through RLS');
END; $$;
RESET ROLE;
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM set_config('request.jwt.claim.sub',c.unknown_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',c.unknown_id,'role','authenticated')::text,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',2,false)',c.order_id,c.planned),'42501','authenticated identity without staff profile is denied');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.track_order_details(''70000991'',NULL,%L)',c.order_id),'42501','authenticated browser cannot bypass server-only tracking RPC');
END; $$;
RESET ROLE;
DO $$ BEGIN
 PERFORM set_config('request.jwt.claim.sub','',true);
 PERFORM set_config('request.jwt.claims','{}',true);
END; $$;
SET LOCAL ROLE anon;
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.set_order_schedule(%L,%L,''proposed'',2,false)',c.order_id,c.planned),'42501','anonymous SQL role is denied before scheduling');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.track_order_details(''70000991'',NULL,%L)',c.order_id),'42501','anonymous browser cannot bypass server-only tracking RPC');
END; $$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $$
DECLARE c pg_temp.schedule_context%rowtype; tracked jsonb; projection jsonb;
BEGIN
 SELECT * INTO c FROM schedule_context;
 tracked:=public.track_order_details('70000991',NULL,c.order_id);
 PERFORM pg_temp.check_schedule(tracked->>'id'=c.order_id::text,'server tracking validates the same synthetic order identity and phone');
 SELECT jsonb_build_object('scheduled_for',scheduled_for,'schedule_status',schedule_status) INTO projection
 FROM public.orders WHERE id=(tracked->>'id')::uuid;
 PERFORM pg_temp.check_schedule((projection->>'scheduled_for')::timestamptz=c.planned AND projection->>'schedule_status'='confirmed','server schedule enrichment reads confirmed fields only for verified order');
 PERFORM pg_temp.expect_schedule_error(format('SELECT public.track_order_details(''70000888'',NULL,%L)',c.order_id),'P0001','incorrect tracking phone does not authorize order access');
END; $$;
RESET ROLE;
DO $$ DECLARE c pg_temp.schedule_context%rowtype; BEGIN
 SELECT * INTO c FROM schedule_context;
 PERFORM pg_temp.check_schedule((SELECT count(*)=2 FROM public.audit_logs WHERE table_name='orders' AND record_id=c.order_id AND action='UPDATE'),'only two successful schedule changes create order update audits');
 PERFORM pg_temp.check_schedule(EXISTS(SELECT 1 FROM public.audit_logs WHERE table_name='orders' AND record_id=c.order_id AND user_id=c.admin_id AND "after"->>'schedule_status'='proposed' AND ("after"->>'schedule_revision')::integer=1),'proposal audit identifies actual admin caller');
 PERFORM pg_temp.check_schedule(EXISTS(SELECT 1 FROM public.audit_logs WHERE table_name='orders' AND record_id=c.order_id AND user_id=c.employee_id AND "after"->>'schedule_status'='confirmed' AND ("after"->>'schedule_revision')::integer=2),'confirmation audit identifies actual employee caller');
 PERFORM pg_temp.check_schedule(NOT EXISTS(SELECT 1 FROM public.payments WHERE order_id IN(c.order_id,c.finished_id,c.physical_id,c.expired_id)),'schedule tests create no payments');
 PERFORM pg_temp.check_schedule(NOT EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id IN(c.order_id,c.finished_id,c.physical_id,c.expired_id)),'schedule tests reserve no inventory');
END; $$;
SELECT jsonb_build_object('pass',true,'checks',count(*),'synthetic_users',3,'synthetic_orders',4,'transaction','ROLLBACK','labels',jsonb_agg(label ORDER BY label)) FROM schedule_checks;
ROLLBACK;
