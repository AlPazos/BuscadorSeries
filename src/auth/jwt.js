// Decodifica el payload (claims) de un JWT SIN verificar la firma. Solo para
// leer datos no sensibles en el cliente —p. ej. el email del ID token de Google,
// que el backend YA ha validado—, nunca para tomar decisiones de seguridad.
// Devuelve el objeto de claims o null si el token no es decodificable.
export function payloadDeJwt(token) {
  try {
    // un JWT es header.payload.firma, cada parte en base64url
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    // atob da bytes "latin1"; los reinterpretamos como UTF-8 (acentos, etc.)
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}
