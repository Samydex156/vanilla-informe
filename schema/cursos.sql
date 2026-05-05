create table public.cursos (
  id uuid not null default gen_random_uuid (),
  nombre text not null,
  total_sesiones integer not null,
  frecuencia text not null,
  creado_en timestamp with time zone null default now(),
  constraint cursos_pkey primary key (id)
) TABLESPACE pg_default;