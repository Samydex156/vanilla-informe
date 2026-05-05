create table public.calificaciones (
  id uuid not null default gen_random_uuid (),
  inscripcion_id uuid null,
  modulo_id uuid null,
  tipo text not null,
  nota numeric(5, 2) null,
  fecha_calificacion date null default CURRENT_DATE,
  numero integer null,
  constraint calificaciones_pkey primary key (id),
  constraint calificaciones_inscripcion_id_fkey foreign KEY (inscripcion_id) references inscripciones (id) on delete CASCADE,
  constraint calificaciones_modulo_id_fkey foreign KEY (modulo_id) references modulos (id) on delete CASCADE,
  constraint calificaciones_nota_check check (
    (
      (nota >= (0)::numeric)
      and (nota <= (100)::numeric)
    )
  )
) TABLESPACE pg_default;