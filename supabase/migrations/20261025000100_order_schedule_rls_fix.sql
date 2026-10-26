-- Scheduling locks require UPDATE visibility under RLS. Staff can read orders,
-- but direct table updates are intentionally denied. Keep scheduling behind the
-- existing authenticated, active-staff RPC and its revision/business guards.
BEGIN;

ALTER FUNCTION public.set_order_schedule(uuid,timestamptz,text,integer,boolean)
  SECURITY DEFINER;
ALTER FUNCTION public.set_order_schedule(uuid,timestamptz,text,integer,boolean)
  SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.set_order_schedule(uuid,timestamptz,text,integer,boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_order_schedule(uuid,timestamptz,text,integer,boolean)
  TO authenticated, service_role;

COMMIT;
