ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_contract jsonb;
ALTER TABLE public.inventory_movements ALTER COLUMN created_by DROP NOT NULL;
COMMENT ON COLUMN public.orders.request_contract IS 'Contrato normalizado original e inmutable; NULL identifica pedidos legacy no verificables. No se publica por RPC de seguimiento.';
