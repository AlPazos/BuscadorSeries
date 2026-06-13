// Cliente para la API de TMDB (The Movie Database): https://developer.themoviedb.org/
// Gratis con API key. Cubre PELÍCULAS y SERIES, con imágenes y ratings.
// Las peticiones van a /api, un proxy que añade la key en el servidor
// (worker/index.js en producción, vite.config.js en desarrollo),
// para que la key nunca sea visible desde el navegador.
const BASE_URL = "/api";
const IMAGE_HOST = "https://image.tmdb.org/t/p";
const IMAGE_BASE = `${IMAGE_HOST}/w500`;

// Mapa fijo y oficial de géneros de TMDB (películas + series) a su nombre en
// español. Los resultados de búsqueda/tendencias traen `genre_ids` (números),
// no los nombres, así que los traducimos aquí sin pedir nada extra.
const GENEROS = {
  28: "Acción",
  12: "Aventura",
  16: "Animación",
  35: "Comedia",
  80: "Crimen",
  99: "Documental",
  18: "Drama",
  10751: "Familia",
  14: "Fantasía",
  36: "Historia",
  27: "Terror",
  10402: "Música",
  9648: "Misterio",
  10749: "Romance",
  878: "Ciencia ficción",
  10770: "Película de TV",
  53: "Suspense",
  10752: "Bélica",
  37: "Western",
  // específicos de series
  10759: "Acción y aventura",
  10762: "Infantil",
  10763: "Noticias",
  10764: "Reality",
  10765: "Ciencia ficción y fantasía",
  10766: "Telenovela",
  10767: "Talk show",
  10768: "Bélica y política",
};

export class TmdbApi {
  // Construye la URL de una imagen de TMDB. Devuelve null si no hay path.
  static imageUrl(path, size = "w500") {
    return path ? `${IMAGE_HOST}/${size}${path}` : null;
  }

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Petición genérica: construye la URL del proxy y maneja errores
  async #request(path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    url.searchParams.set("language", "es-ES");
    for (const [key, value] of Object.entries(params)) {
      if (value != null) url.searchParams.set(key, value);
    }

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`TMDB API error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  // Normaliza un resultado de TMDB (movie o tv) a la forma que consume la Card
  #normalize(item) {
    const date = item.release_date ?? item.first_air_date;
    // los resultados de búsqueda/tendencias traen `genre_ids` (números); el
    // detalle de un title trae `genres` [{id, name}] — usamos los ids en ambos
    const idsGenero = item.genre_ids ?? (item.genres ?? []).map((g) => g.id);
    return {
      id: item.id,
      type: item.media_type ?? (item.title ? "movie" : "tv"),
      title: item.title ?? item.name,
      originalTitle: item.original_title ?? item.original_name ?? null,
      year: date ? date.slice(0, 4) : null,
      image: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null,
      rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
      votes: item.vote_count ?? null,
      plot: item.overview || null,
      genres: idsGenero.map((id) => GENEROS[id]).filter(Boolean),
    };
  }

  // Devuelve los titles en tendencia, normalizados.
  // mediaType: "all" | "movie" | "tv"; window: "day" | "week"
  async getTrending(mediaType = "all", window = "day") {
    const data = await this.#request(`/trending/${mediaType}/${window}`);
    return (data.results ?? [])
      .filter((item) => item.media_type !== "person")
      .map((item) => this.#normalize(item));
  }

  // Descubre títulos de un género concreto, ordenados por popularidad.
  // mediaType: "movie" | "tv"; genreId: id de género de TMDB.
  async getByGenre(mediaType, genreId) {
    const data = await this.#request(`/discover/${mediaType}`, {
      with_genres: genreId,
      sort_by: "popularity.desc",
    });
    return (data.results ?? []).map((item) => this.#normalize(item));
  }

  // Busca películas y series por texto; devuelve un array normalizado
  async searchTitles(query) {
    if (!query?.trim()) return [];
    const data = await this.#request("/search/multi", { query });
    return (data.results ?? [])
      .filter((item) => item.media_type !== "person") // descarta actores/directores
      .map((item) => this.#normalize(item));
  }

  // Obtiene un title concreto. type: "movie" | "tv"
  async getTitle(id, type = "movie") {
    const data = await this.#request(`/${type}/${id}`);
    return this.#normalize(data);
  }

  // Devuelve la lista de temporadas de una serie (sin la 0 / "especiales")
  async getSeasons(seriesId) {
    const data = await this.#request(`/tv/${seriesId}`);
    return (data.seasons ?? []).filter((s) => s.season_number > 0);
  }

  // Devuelve una temporada con todos sus episodios (campo `episodes`)
  async getSeason(seriesId, seasonNumber) {
    return this.#request(`/tv/${seriesId}/season/${seasonNumber}`);
  }

  // Devuelve los datos de un episodio concreto
  async getEpisode(seriesId, seasonNumber, episodeNumber) {
    return this.#request(
      `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`
    );
  }
}

export default TmdbApi;
