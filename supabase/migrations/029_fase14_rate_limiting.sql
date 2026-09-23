-- ============================================================
-- NOVA FLORERÍA — FASE 14: RATE LIMITING BÁSICO
-- Tabla + función atómica para limitar intentos por IP y ruta
-- en los endpoints públicos sensibles. No depende de servicios
-- externos (Redis/Upstash): todo vive en Supabase/PostgreSQL.
-- ============================================================

create table if not exists public.rate_limit_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  route text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_attempts_ip_route_time
  on public.rate_limit_attempts (ip, route, created_at desc);

-- Nadie necesita leer/escribir esta tabla directamente: solo se
-- accede a través de check_rate_limit() (security definer). Se
-- habilita RLS sin policies para bloquear cualquier acceso directo
-- desde anon/authenticated.
alter table public.rate_limit_attempts enable row level security;

-- ------------------------------------------------------------
-- check_rate_limit: cuenta + registra el intento en una sola
-- operación atómica (evita condiciones de carrera entre contar
-- e insertar). Devuelve true si el intento está permitido,
-- false si ya se alcanzó el límite en la ventana.
-- ------------------------------------------------------------
create or replace function public.check_rate_limit(
  p_ip text,
  p_route text,
  p_max_attempts int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_ip is null or p_ip = '' then
    raise exception 'IP requerida para rate limiting.';
  end if;

  if p_max_attempts is null or p_max_attempts <= 0 then
    raise exception 'p_max_attempts debe ser mayor a 0.';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'p_window_seconds debe ser mayor a 0.';
  end if;

  -- Limpieza oportunista y acotada: 1% de las llamadas borran
  -- intentos de más de 1 hora en toda la tabla, para que no crezca
  -- indefinidamente sin depender de pg_cron (que puede no estar
  -- habilitado en todos los planes de Supabase).
  if random() < 0.01 then
    delete from public.rate_limit_attempts
    where created_at < now() - interval '1 hour';
  end if;

  select count(*) into v_count
  from public.rate_limit_attempts
  where ip = p_ip
    and route = p_route
    and created_at >= now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into public.rate_limit_attempts (ip, route)
  values (p_ip, p_route);

  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, text, int, int) to anon, authenticated;
