-- Public tracking goes through the validated, rate-limited Next.js server API.
-- Definitions and historical data remain unchanged; no browser RPC access.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.track_order_details(text,bigint,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order_details(text,bigint,uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.track_order(bigint,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order(bigint,text) TO service_role;
COMMIT;
