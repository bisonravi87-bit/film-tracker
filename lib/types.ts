export interface Movie {
  id: string; title: string; original_title: string | null; release_year: number | null;
  poster_path: string | null; backdrop_path: string | null; overview: string | null;
  runtime: number | null; vote_average: number | null;
}
export interface Director { id: string; name: string; profile_path: string | null; biography: string | null }
export interface PersonResult { id: number; name: string; profile_path: string | null; known_for_department: string }
export interface Genre { id: number; name: string; slug: string; is_custom: boolean }

/** Estado del usuario sobre una película (fila de user_movie_status). */
export interface Status {
  watched: boolean;
  watched_at: string | null;
  rating: number | null;
  notes: string | null;
  is_favorite: boolean;
}

/** Mapa movie_id -> estado del usuario. */
export type StatusMap = Record<string, Status>;

export const EMPTY_STATUS: Status = {
  watched: false,
  watched_at: null,
  rating: null,
  notes: null,
  is_favorite: false,
};
