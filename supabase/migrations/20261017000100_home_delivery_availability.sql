-- Configuración persistente para pausar únicamente nuevos pedidos a domicilio.
-- No altera pedidos existentes, horarios, precios, inventario ni disponibilidad de recojo.
BEGIN;

INSERT INTO public.system_settings (key, value, is_critical)
VALUES ('delivery_enabled', '{"enabled":true}'::jsonb, true)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_settings
  ADD CONSTRAINT delivery_enabled_boolean
  CHECK (key <> 'delivery_enabled' OR coalesce(jsonb_typeof(value->'enabled'), '') = 'boolean');

CREATE FUNCTION public.enforce_home_delivery_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  delivery_is_enabled boolean;
BEGIN
  -- Public checkout identifies the fulfillment choice in the first message line.
  -- Physical sales and every existing order are left untouched.
  IF NEW.order_type = 'online'
     AND split_part(coalesce(NEW.customer_message, ''), E'\n', 1) = 'Método: Entrega por coordinar' THEN
    SELECT CASE
      WHEN jsonb_typeof(value->'enabled') = 'boolean' THEN (value->>'enabled')::boolean
      ELSE false
    END
    INTO delivery_is_enabled
    FROM public.system_settings
    WHERE key = 'delivery_enabled';

    IF coalesce(delivery_is_enabled, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'La entrega a domicilio está temporalmente no disponible.' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER enforce_home_delivery_availability_before_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_home_delivery_availability();

REVOKE ALL ON FUNCTION public.enforce_home_delivery_availability() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
