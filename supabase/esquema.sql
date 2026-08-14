-- ==========================================================
-- HABITOTCHI · la tabla de datos sincronizados
-- ==========================================================
-- Se pega una sola vez en el editor SQL de Supabase (SQL
-- Editor → New query), al crear el proyecto.
--
-- Una sola tabla, con forma clave→valor: la columna "clave"
-- usa los mismos nombres que ya existen en CLAVES de
-- src/lib/almacenamiento.ts. No hay que rediseñar nada del
-- modelo de datos de la app, es el mismo mapa de siempre,
-- ahora también en la nube.
-- ==========================================================

create table datos_usuario (
  usuario_id uuid references auth.users(id) on delete cascade not null,
  clave text not null,
  valor jsonb not null,
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, clave)
);

-- ----------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------
-- Sin esto, cualquiera con la anon key (que no es secreta,
-- viaja en el código de la app) podría leer o escribir la
-- fila de cualquier persona. Con esto activado, cada quien
-- solo puede tocar sus propias filas — la base de datos
-- misma lo obliga, no depende de que el código de la app se
-- porte bien.
-- ----------------------------------------------------------

alter table datos_usuario enable row level security;

create policy "cada quien ve y edita solo lo suyo"
on datos_usuario
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);
