// Sesión de usuario compartida con toda la app vía Context: cualquier
// componente puede hacer `const { usuario, login } = useAuth()` sin que App
// tenga que ir pasando props por toda la cadena (el famoso "prop drilling").
//
// La sesión sobrevive a recargas guardándose en localStorage junto a su
// instante de caducidad: al arrancar se descarta si el token ya expiró, y
// mientras la app está abierta un temporizador cierra la sesión justo
// cuando el JWT deja de valer (60 min), para no dejar un token muerto.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { UsuariosApi } from '../api/UsuariosApi.js'
import { payloadDeJwt } from './jwt.js'

const CLAVE_SESION = 'sesion'

// sesion = {token, email, expiraEn (timestamp en ms)} o null
const leerSesionGuardada = () => {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION))
    return sesion?.token && sesion.expiraEn > Date.now() ? sesion : null
  } catch {
    return null // JSON corrupto o localStorage inaccesible: como si no hubiera sesión
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesionGuardada)

  // el cliente se recrea cada vez que cambia el token, ya configurado con él
  // (crearlo es gratis; mutarlo después del render iría contra las reglas de React)
  const api = useMemo(() => {
    const api = new UsuariosApi()
    api.token = sesion?.token ?? null
    return api
  }, [sesion?.token])

  // persiste la sesión y programa su cierre automático al caducar el token
  useEffect(() => {
    if (!sesion) {
      localStorage.removeItem(CLAVE_SESION)
      return
    }
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    const timer = setTimeout(() => setSesion(null), sesion.expiraEn - Date.now())
    return () => clearTimeout(timer)
  }, [sesion])

  // arranca la sesión con un JWT nuestro recién emitido (login normal o Google).
  // El email lo guardamos para mostrarlo en el nav/perfil; si no se conoce, se
  // saca del claim `upn` del propio token.
  const iniciarSesion = (token, expiraEnSegundos, email) => {
    const emailSesion = email ?? payloadDeJwt(token)?.upn ?? null
    setSesion({
      token,
      email: emailSesion,
      expiraEn: Date.now() + expiraEnSegundos * 1000,
    })
  }

  const login = async (email, password) => {
    const { token, expiraEnSegundos } = await api.login({ email, password })
    iniciarSesion(token, expiraEnSegundos, email)
  }

  // login social: canjea el ID token de Google por nuestro JWT (misma respuesta
  // que /login). El email lo lleva el propio token devuelto (claim `upn`).
  const loginGoogle = async (idToken) => {
    const { token, expiraEnSegundos } = await api.loginGoogle(idToken)
    iniciarSesion(token, expiraEnSegundos)
  }

  // crea la cuenta pero YA NO entra: ahora hay que verificar el email antes de
  // poder iniciar sesión (el login devuelve 403 hasta entonces). La UI muestra
  // la pantalla de "revisa tu correo".
  const registro = async ({ email, password, nombre }) => {
    await api.registro({ email, password, nombre })
  }

  // reenvía el correo de verificación (responde 200 siempre)
  const reenviarVerificacion = (email) => api.reenviarVerificacion(email)

  // confirma el email desde la página /verificar (no inicia sesión)
  const verificarEmail = (token) => api.verificarEmail(token)

  const logout = () => setSesion(null)

  const value = {
    usuario: sesion ? { email: sesion.email } : null, // null = nadie dentro
    api, // para favoritos/preferencias: ya lleva el token puesto
    login,
    loginGoogle,
    registro,
    reenviarVerificacion,
    verificarEmail,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook y provider van juntos a propósito
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
