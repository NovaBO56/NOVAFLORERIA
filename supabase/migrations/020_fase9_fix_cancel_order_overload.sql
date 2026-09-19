-- ============================================================
-- NOVA FLORERÍA — FASE 9: fix de sobrecarga de cancel_order()
-- La versión vieja de 3 parámetros (de Fase 5) seguía existiendo
-- en paralelo a la nueva de 2 parámetros, y la API todavía la
-- llamaba, saltándose todas las protecciones de Fase 9.
-- ============================================================

drop function if exists public.cancel_order(uuid, text, uuid);