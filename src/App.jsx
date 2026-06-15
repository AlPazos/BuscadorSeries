import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import Card from './components/Card/Card.jsx'
import Detail from './components/Detail/Detail.jsx'
import BlurText from './components/BlurText/BlurText.jsx'
import CardNav from './components/CardNav/CardNav.jsx'
import ThemeToggle from './components/ThemeToggle/ThemeToggle.jsx'
import SearchBar from './components/SearchBar/SearchBar.jsx'
import OrbitImages from './components/OrbitImages/OrbitImages.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog.jsx'
import VideoPlayer from './components/VideoPlayer/VideoPlayer.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import { FavoritosProvider, useFavoritos } from './favoritos/FavoritosContext.jsx'
import Favorites from './components/Favorites/Favorites.jsx'
import Descubrir from './components/Descubrir/Descubrir.jsx'
import Perfil from './components/Perfil/Perfil.jsx'
import Verificar from './components/Verificar/Verificar.jsx'
import Dock from './components/Dock/Dock.jsx'
import Aurora from './components/Aurora/Aurora.jsx'
import { TmdbApi } from './api/TmdbApi.js'
import { useDebounce } from './hooks/useDebounce.js'

const tmdb = new TmdbApi()

// ponytail: Aurora es WebGL con loop rAF continuo a pantalla completa → el mayor
// coste de GPU en móvil. No la montamos en pantallas pequeñas ni con reduced-motion.
const fondoPesado =
  window.matchMedia('(min-width: 768px)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

// iconos del CTA del nav (salir / entrar)
const IconoSalir = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)
const IconoEntrar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="m10 17 5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
)

// iconos del dock de navegación
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}
const IconoTendencias = (
  <svg {...svgProps}>
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="15 7 21 7 21 13" />
  </svg>
)
const IconoBuscar = (
  <svg {...svgProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)
const IconoFavoritos = (
  <svg {...svgProps}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
const IconoPerfil = (
  <svg {...svgProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
)

// Enlaces del menú del CardNav (estáticos: externos). La navegación entre
// vistas la lleva el Dock; aquí quedan los enlaces externos (y se irán
// añadiendo más cosas con el tiempo).
const ITEMS_NAV = [
  {
    label: 'El proyecto',
    bgColor: 'var(--code-bg)',
    textColor: 'var(--text-h)',
    links: [
      { label: 'TMDB', href: 'https://www.themoviedb.org/', target: '_blank' },
    ],
  },
  {
    label: 'Sígueme',
    bgColor: 'var(--accent)',
    textColor: '#fff',
    links: [
      { label: 'GitHub', href: 'https://github.com/AlPazos', target: '_blank' },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/alex-pazos/',
        target: '_blank',
      },
    ],
  },
]

// Cuadrícula de resultados. Las cards salen en cuanto llegan los títulos de
// TMDB, sin esperar a la lista de favoritos: es el corazón (FavoriteButton)
// el que no se pinta hasta conocer la verdad, así nunca aparece en falso.
// Es un componente aparte porque App renderiza el FavoritosProvider y no
// puede consumir su contexto; este sí, porque vive dentro.
function Resultados({ titles, onSelect }) {
  const { errorCarga, reintentarCarga } = useFavoritos()

  return (
    <>
      {/* si los favoritos no se pudieron cargar, los corazones no aparecen:
          avisar y ofrecer reintentar, sin bloquear el catálogo */}
      {errorCarga && (
        <p className="aviso-cargando">
          No se han podido cargar tus favoritos.{' '}
          <button className="boton-reintentar" onClick={reintentarCarga}>
            Reintentar
          </button>
        </p>
      )}

      <div className="cards-grid">
        {titles.map((t, i) => (
          // los ids de TMDB son únicos POR TIPO (una película y una serie
          // pueden compartir id): la key necesita el tipo para no colisionar
          <Card key={`${t.type}-${t.id}`} title={t} index={i} onClick={onSelect} />
        ))}
      </div>
    </>
  )
}

function App() {
  const { usuario, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [titles, setTitles] = useState([])
  const [selected, setSelected] = useState(null) // title abierto en detalle
  const [modalAuth, setModalAuth] = useState(null) // null | 'login' | 'registro'
  const [confirmarSalir, setConfirmarSalir] = useState(false) // diálogo de logout

  // navegación por rutas: las vistas tienen URL (/, /buscar, /mis-favoritos)
  const navigate = useNavigate()
  const location = useLocation()

  // useCallback: identidad estable entre renders; si fuera un arrow inline,
  // el value memoizado de FavoritosProvider se invalidaría en cada render
  // de App y los corazones se re-renderizarían sin necesidad
  const pedirLogin = useCallback(() => setModalAuth('login'), [])

  // query "retrasado": solo cambia 400ms después de la última tecla
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    // sin texto no se busca nada (las tendencias viven ahora en "Descubrir")
    const q = debouncedQuery.trim()
    if (!q) return
    // `cancelado` evita una condición de carrera: si la búsqueda cambia con
    // una petición aún en vuelo, su respuesta (que puede llegar DESPUÉS que
    // la de la búsqueda nueva) se descarta en vez de pisar los resultados
    let cancelado = false
    tmdb
      .searchTitles(q)
      .then((lista) => !cancelado && setTitles(lista))
      .catch(() => {}) // TMDB caído: se conserva lo que hubiera en pantalla
    return () => {
      cancelado = true
    }
  }, [debouncedQuery])

  // con el buscador vacío no se muestran resultados (sin esperar al debounce
  // para vaciar): así al borrar la búsqueda las cards desaparecen al instante
  const resultados = query.trim() ? titles : []

  // Ítems del Dock (navegación principal). El icono de Favoritos/Perfil abre el
  // login si no hay sesión, en vez de redirigir en silencio. `active` marca la
  // vista actual según la ruta.
  const ruta = location.pathname
  const dockItems = [
    { icon: IconoTendencias, label: 'Tendencias', onClick: () => navigate('/'), active: ruta === '/' },
    { icon: IconoBuscar, label: 'Buscar', onClick: () => navigate('/buscar'), active: ruta === '/buscar' },
    {
      icon: IconoFavoritos,
      label: 'Favoritos',
      onClick: () => (usuario ? navigate('/mis-favoritos') : setModalAuth('login')),
      active: ruta === '/mis-favoritos',
    },
    {
      icon: IconoPerfil,
      label: 'Perfil',
      onClick: () => (usuario ? navigate('/perfil') : setModalAuth('login')),
      active: ruta === '/perfil',
    },
  ]

  return (
    // El provider vive aquí (y no en main.jsx) porque necesita abrir el modal
    // de login, que es estado de App. Va dentro de AuthProvider, que ya
    // envuelve a App entera, así que useAuth() funciona en su interior.
    <FavoritosProvider alPedirSesion={pedirLogin}>
      {/* Fondo «Aurora» (React Bits): bandas neón magenta/cian por detrás de
          todo. Pinta con transparencia, así que se funde con el fondo. La
          intensidad por tema está en Aurora.css (--aurora-opacity). */}
      {fondoPesado && <Aurora colorStops={['#ff2ec4', '#18e0ff', '#9c3cff']} amplitude={1.0} blend={0.5} speed={0.5} />}

      <CardNav
        logo="/favicon.png"
        logoAlt="Buscador de películas y series"
        logoText="Buscador"
        items={ITEMS_NAV}
        ctaLabel={usuario ? 'Salir' : 'Entrar'}
        ctaIcon={usuario ? IconoSalir : IconoEntrar}
        onCtaClick={usuario ? () => setConfirmarSalir(true) : () => setModalAuth('login')}
        onLogoClick={() => navigate('/')}
        topRightExtra={<ThemeToggle />}
      />

      {/* el `key` por pathname remonta el contenedor al cambiar de ruta y
          dispara la animación de entrada (no cambia al teclear en el buscador,
          así no se reanima en cada búsqueda) */}
      <div className="vista" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Descubrir onSelect={setSelected} />} />

          <Route
            path="/buscar"
            element={
              <>
                <BlurText
                  as="h1"
                  className="vista-titulo"
                  text="Buscador"
                  animateBy="letters"
                  direction="top"
                  delay={60}
                />
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Busca una película o serie…"
                />

                {/* sin texto: orbit decorativo; con texto: resultados */}
                {query.trim() ? (
                  <Resultados titles={resultados} onSelect={setSelected} />
                ) : (
                  <OrbitImages />
                )}
              </>
            }
          />

          {/* favoritos solo con sesión: si no hay (o caduca), a Descubrir */}
          <Route
            path="/mis-favoritos"
            element={
              usuario ? (
                <Favorites onSelect={setSelected} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* perfil solo con sesión */}
          <Route
            path="/perfil"
            element={
              usuario ? (
                <Perfil onSalir={() => setConfirmarSalir(true)} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* verificación de email (pública): /verificar?token=...
              onEntrar abre el modal de login (estado de App) tras verificar */}
          <Route path="/verificar" element={<Verificar onEntrar={pedirLogin} />} />

          {/* cualquier otra ruta → Descubrir */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* detalle como modal centrado */}
      {selected && <Detail title={selected} onBack={() => setSelected(null)} />}

      {/* login o registro como modal centrado */}
      {modalAuth && (
        <AuthModal
          modo={modalAuth}
          onCambiarModo={setModalAuth}
          onClose={() => setModalAuth(null)}
        />
      )}

      {/* confirmación antes de cerrar sesión */}
      {confirmarSalir && (
        <ConfirmDialog
          titulo="Cerrar sesión"
          mensaje="¿Seguro que quieres salir de tu cuenta?"
          confirmarLabel="Salir"
          cancelarLabel="Cancelar"
          onConfirm={() => {
            logout()
            setConfirmarSalir(false)
          }}
          onCancel={() => setConfirmarSalir(false)}
        />
      )}

      {/* navegación principal: dock flotante abajo */}
      <Dock items={dockItems} />

      {/* atribución requerida por los términos de uso de la API de TMDB */}
      <footer className="tmdb-footer">
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          <img className="tmdb-logo" src="/tmdbLogo.svg" alt="The Movie Database (TMDB)" />
        </a>
        <p>
          Este producto usa la API de TMDB, pero no está avalado ni certificado por TMDB.
        </p>
      </footer>
    </FavoritosProvider>
  )
}

export default App
