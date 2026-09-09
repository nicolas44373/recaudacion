-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Crea la tabla que usa el apartado "Configuración" para administrar categorías.

create table if not exists public.categorias (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  tipo       text not null check (tipo in ('ingreso', 'gasto')),
  orden      integer not null default 0,
  created_at timestamptz not null default now(),
  unique (nombre, tipo)
);

alter table public.categorias enable row level security;

-- App sin login: se permite acceso total con la anon key.
drop policy if exists "categorias_acceso_total" on public.categorias;
create policy "categorias_acceso_total"
  on public.categorias
  for all
  using (true)
  with check (true);

-- Opcional: notificar cambios en tiempo real.
-- alter publication supabase_realtime add table public.categorias;
