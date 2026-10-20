# Film Tracker

Tacha las películas de tus directores favoritos, sigue tu progreso por género y estilo, y lleva un diario (nota, comentario, favorita) de lo que ves.

## Puesta en marcha

1. `npm install`
2. Copia `.env.example` a `.env.local` y rellena las claves (Supabase + TMDB Read Access Token).
3. En el **SQL Editor** de Supabase ejecuta, en orden:
   1. `supabase/schema.sql` (tablas + RLS)
   2. `supabase/functions.sql` (funciones `genre_progress` y `director_progress`)
4. `npm run dev`

## Siembra de géneros y estilos (Fase 3)

Con las claves en el entorno (o exportadas en la terminal):

```bash
npm run seed:genres    # géneros canónicos de TMDB
npm run seed:discover  # 150 películas más votadas por género (configurable en scripts/seed-tmdb-data.ts)
npm run seed:styles    # estilos curados de scripts/curated-styles.json
npm run seed:all       # todo lo anterior
```

`scripts/curated-styles.json` da **títulos** (con año opcional para desambiguar) y el script resuelve cada ID real buscando en TMDB, para no fiarse de IDs escritos de memoria. Amplía la lista cuando quieras y vuelve a ejecutar `npm run seed:styles`.

## Horas vistas

El endpoint de créditos no devuelve duración; en el panel de inicio hay un botón «Calcular duración» que pide el detalle de las películas vistas y guarda `runtime` en lote.

## Despliegue

- Sube a GitHub e importa el proyecto en Vercel (plan Hobby).
- Añade las cuatro variables de `.env.local` en *Settings → Environment Variables*.
- En Supabase → *Authentication → URL Configuration*: Site URL en tu URL de Vercel y Redirect URLs con Vercel + `http://localhost:3000`.
