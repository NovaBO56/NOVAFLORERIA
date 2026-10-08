-- Dedicated, bounded public receipt quota. Server-only RPC ACL is preserved.
BEGIN;
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip text, p_route text, p_max_attempts integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE attempts integer;
BEGIN
 IF p_ip IS NULL OR length(p_ip) NOT BETWEEN 1 AND 200 OR p_max_attempts IS NULL OR p_window_seconds IS NULL OR p_max_attempts NOT BETWEEN 1 AND 100 OR p_window_seconds NOT BETWEEN 1 AND 3600 THEN RAISE EXCEPTION 'Límite inválido.'; END IF;
 IF p_route IS NULL OR p_route NOT IN ('trackOrder','orderReceipt','createOrder','reportPayment','getPaymentQr','getBusinessHours','getWhatsappConfig') THEN RAISE EXCEPTION 'Ruta inválida.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('rate:'||p_ip||':'||p_route,0));
 SELECT count(*) INTO attempts FROM public.rate_limit_attempts WHERE ip=p_ip AND route=p_route AND created_at>=clock_timestamp()-make_interval(secs=>p_window_seconds);
 IF attempts>=p_max_attempts THEN RETURN false; END IF;
 INSERT INTO public.rate_limit_attempts(ip,route) VALUES(p_ip,p_route);
 IF random()<0.01 THEN DELETE FROM public.rate_limit_attempts WHERE id IN (SELECT id FROM public.rate_limit_attempts WHERE created_at<now()-interval '1 hour' LIMIT 1000); END IF;
 RETURN true;
END; $function$;
COMMIT;
