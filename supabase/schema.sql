-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Movies Table (Local Cache of TMDB Data)
CREATE TABLE public.movies (
    id VARCHAR(50) PRIMARY KEY, -- TMDB Movie ID
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    release_year INT,
    poster_path TEXT,
    backdrop_path TEXT,
    overview TEXT,
    runtime INT,
    vote_average NUMERIC(3, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Directors Table
CREATE TABLE public.directors (
    id VARCHAR(50) PRIMARY KEY, -- TMDB Person ID
    name VARCHAR(255) NOT NULL,
    profile_path TEXT,
    biography TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Genres / Styles Table
CREATE TABLE public.genres (
    id INT PRIMARY KEY, -- TMDB Genre ID or Custom Negative IDs for Micro-genres
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE
);

-- 4. Movie-Director Association (N:M)
CREATE TABLE public.movie_directors (
    movie_id VARCHAR(50) REFERENCES public.movies(id) ON DELETE CASCADE,
    director_id VARCHAR(50) REFERENCES public.directors(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, director_id)
);

-- 5. Movie-Genre Association (N:M)
CREATE TABLE public.movie_genres (
    movie_id VARCHAR(50) REFERENCES public.movies(id) ON DELETE CASCADE,
    genre_id INT REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- 6. User Watch Status & Diary
CREATE TABLE public.user_movie_status (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id VARCHAR(50) REFERENCES public.movies(id) ON DELETE CASCADE,
    watched BOOLEAN DEFAULT FALSE,
    watched_at TIMESTAMP WITH TIME ZONE,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 10),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, movie_id)
);

-- Row Level Security (RLS)
ALTER TABLE public.user_movie_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_genres ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles can read shared metadata" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Public profiles can read directors" ON public.directors FOR SELECT USING (true);
CREATE POLICY "Public profiles can read genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Public profiles can read relations" ON public.movie_directors FOR SELECT USING (true);
CREATE POLICY "Public profiles can read genre relations" ON public.movie_genres FOR SELECT USING (true);

-- User status policies
CREATE POLICY "Users can manage their own movie status"
    ON public.user_movie_status
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
