CREATE OR REPLACE TRIGGER protect_order_request_contract BEFORE UPDATE OF request_contract ON public.orders FOR EACH ROW EXECUTE FUNCTION public.protect_order_request_contract();
CREATE OR REPLACE TRIGGER validate_inventory_movement_actor BEFORE INSERT OR UPDATE ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_movement_actor();
