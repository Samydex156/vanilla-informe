create table public.asistencias (
  id uuid not null default gen_random_uuid (),
  inscripcion_id uuid null,
  fecha date not null default CURRENT_DATE,
  estado text not null,
  hora_llegada time without time zone null,
  modulo_actual_id uuid null,
  constraint asistencias_pkey primary key (id),
  constraint asistencias_inscripcion_id_fkey foreign KEY (inscripcion_id) references inscripciones (id) on delete CASCADE,
  constraint asistencias_modulo_actual_id_fkey foreign KEY (modulo_actual_id) references modulos (id)
) TABLESPACE pg_default;