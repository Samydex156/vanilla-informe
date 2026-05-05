create table public.inscripciones (
  id uuid not null default gen_random_uuid (),
  estudiante_id uuid null,
  curso_id uuid null,
  modulo_inicio_id uuid null,
  fecha_ingreso date not null,
  clases_asistidas integer null default 0,
  estado text null default 'Activo'::text,
  observaciones text null,
  constraint inscripciones_pkey primary key (id),
  constraint inscripciones_curso_id_fkey foreign KEY (curso_id) references cursos (id) on delete CASCADE,
  constraint inscripciones_estudiante_id_fkey foreign KEY (estudiante_id) references estudiantes (id) on delete CASCADE,
  constraint inscripciones_modulo_inicio_id_fkey foreign KEY (modulo_inicio_id) references modulos (id)
) TABLESPACE pg_default;