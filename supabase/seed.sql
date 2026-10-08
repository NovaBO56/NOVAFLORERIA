-- CANDIDATA: solo nueva instancia después de BASELINE_CANDIDATE.sql.
-- Defaults de instalación, sin clientes, usuarios, productos o configuraciones privadas.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
       ('payment-qr', 'payment-qr', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- No sube archivos. Límites de payment-qr propuestos: no copiar ausencia de límites remota.
INSERT INTO public.cash_registers (name, is_active)
SELECT 'Caja principal', true WHERE NOT EXISTS (SELECT 1 FROM public.cash_registers);
-- Caja sin sesión abierta, saldo o movimientos; la apertura corresponde al operador.
INSERT INTO public.business_hours (day_of_week, opens_at, closes_at, is_closed)
SELECT d::smallint, NULL::time, NULL::time, true FROM generate_series(0,6) d
ON CONFLICT (day_of_week) DO NOTHING;
-- Cerrado por defecto hasta que el administrador defina su horario real.
INSERT INTO public.system_settings (key, value, is_critical)
VALUES ('accept_orders_outside_hours', '{"enabled":false}'::jsonb, true)
ON CONFLICT (key) DO NOTHING;
-- QR/WhatsApp: no insertar filas ni valores ficticios. Configurar mediante panel existente.
COMMIT;
