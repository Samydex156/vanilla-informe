create table public.estudiantes (
  id uuid not null default gen_random_uuid (),
  nombre_completo text not null,
  fecha_registro timestamp with time zone null default now(),
  constraint estudiantes_pkey primary key (id)
) TABLESPACE pg_default;