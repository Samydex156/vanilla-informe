create table public.modulos (
  id uuid not null default gen_random_uuid (),
  curso_id uuid null,
  nombre text not null,
  orden integer not null,
  cantidad_clases integer not null,
  constraint modulos_pkey primary key (id),
  constraint modulos_curso_id_fkey foreign KEY (curso_id) references cursos (id) on delete CASCADE
) TABLESPACE pg_default;