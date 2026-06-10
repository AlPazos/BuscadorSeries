// Cliente para la API de TMDB (The Movie Database): https://developer.themoviedb.org/
// Gratis con API key. Cubre PELÍCULAS y SERIES, con imágenes y ratings.
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_HOST = "https://image.tmdb.org/t/p";
const IMAGE_BASE = `${IMAGE_HOST}/w500`;

export class TmdbApi {
  // Construye la URL de una imagen de TMDB. Devuelve null si no hay path.
  static imageUrl(path, size = "w500") {
    return path ? `${IMAGE_HOST}/${size}${path}` : null;
  }

  // La key se lee de la variable de entorno VITE_TMDB_API_KEY (ver .env)
  constructor(apiKey = import.meta.env.VITE_TMDB_API_KEY, baseUrl = BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // Petición genérica: añade la api_key y maneja errores
  async #request(path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("api_key", this.apiKey);
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
    };
  }

  // Devuelve los titles en tendencia (películas y series), normalizados.
  // window: "day" | "week"
  async getTrending(window = "day") {
    const data = await this.#request(`/trending/all/${window}`);
    return (data.results ?? [])
      .filter((item) => item.media_type !== "person")
      .map((item) => this.#normalize(item));
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
