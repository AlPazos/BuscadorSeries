// Client ID de OAuth de Google. A diferencia de la key de TMDB, este valor NO
// es secreto: es el "audience" que el backend exige al verificar el ID token,
// y de hecho viaja siempre al navegador (Google Identity Services lo necesita
// en el cliente). Por eso puede ir en el bundle. Se puede sobreescribir por
// entorno con VITE_GOOGLE_CLIENT_ID; si no, usa el valor por defecto (así la
// build de producción funciona aunque ese .env no llegue al builder).
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '906523621841-25f2dgstv22l10fm4fahi8hqu4v5rvdq.apps.googleusercontent.com'
