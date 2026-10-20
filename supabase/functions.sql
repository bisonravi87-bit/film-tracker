-- Funciones RPC usadas por la app (ejecutar en Supabase → SQL Editor).
-- Son `security invoker`: se ejecutan con el usuario que llama y respetan RLS.

-- Progreso por género/estilo: cuántas películas cacheadas hay y cuántas ha visto el usuario.
create or replace function public.genre_progress()
returns table (genre_id int, name text, slug text, is_custom boolean, total bigint, watched bigint)
language sql
security invoker
stable
as $$
  select g.id, g.name, g.slug, g.is_custom,
         count(mg.movie_id) as total,
         count(ums.movie_id) filter (where ums.watched) as watched
  from public.genres g
  join public.movie_genres mg on mg.genre_id = g.id
  left join public.user_movie_status ums
         on ums.movie_id = mg.movie_id and ums.user_id = auth.uid()
  group by g.id, g.name, g.slug, g.is_custom
  order by g.is_custom desc, g.name;
$$;

-- Progreso por director: solo directores con alguna película marcada por el usuario.
create or replace function public.director_progress()
returns table (director_id varchar, name text, profile_path text, total bigint, watched bigint)
language sql
security invoker
stable
as $$
  select d.id, d.name, d.profile_path,
         count(distinct md.movie_id) as total,
         count(distinct ums.movie_id) filter (where ums.watched) as watched
  from public.movie_directors md
  join public.directors d on d.id = md.director_id
  left join public.user_movie_status ums
         on ums.movie_id = md.movie_id and ums.user_id = auth.uid()
  where exists (
    select 1 from public.user_movie_status s
    where s.movie_id = md.movie_id and s.user_id = auth.uid()
  )
  group by d.id, d.name, d.profile_path
  order by total asc;
$$;
