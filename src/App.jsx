import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { TmdbApi } from './api/TmdbApi.js'
import { useDebounce } from './hooks/useDebounce.js'

const tmdb = new TmdbApi()

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
  const [vista, setVista] = useState('descubrir') // 'descubrir' | 'buscar' | 'favoritos'

  // la vista de favoritos solo tiene sentido con sesión: si caduca o se
  // cierra, se vuelve a Descubrir sin tener que sincronizar nada a mano
  const vistaEfectiva = vista === 'favoritos' && usuario == null ? 'descubrir' : vista

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

  // Tarjetas del menú del nav; la de "Cuenta" cambia según haya sesión o no.
  // useMemo: solo se recrean al cambiar la sesión — CardNav reconstruye su
  // animación cuando le llegan items nuevos, y no debe hacerlo en cada render.
  const itemsNav = useMemo(() => [
    {
      label: 'Explorar',
      bgColor: 'var(--code-bg)',
      textColor: 'var(--text-h)',
      links: [
        {
          label: 'Descubrir',
          onClick: () => setVista('descubrir'),
          ariaLabel: 'Ir a Descubrir',
        },
        {
          label: 'Buscar',
          onClick: () => setVista('buscar'),
          ariaLabel: 'Ir a Buscar',
        },
        { label: 'TMDB', href: 'https://www.themoviedb.org/', target: '_blank' },
      ],
    },
    usuario
      ? {
          label: 'Cuenta',
          bgColor: 'var(--accent)',
          textColor: '#fff',
          links: [
            { label: 'Mis favoritos', onClick: () => setVista('favoritos') },
            { label: 'Cerrar sesión', onClick: () => setConfirmarSalir(true) },
          ],
        }
      : {
          label: 'Cuenta',
          bgColor: 'var(--accent)',
          textColor: '#fff',
          links: [
            { label: 'Entrar', onClick: () => setModalAuth('login') },
            { label: 'Crear cuenta', onClick: () => setModalAuth('registro') },
          ],
        },
  ], [usuario])

  return (
    // El provider vive aquí (y no en main.jsx) porque necesita abrir el modal
    // de login, que es estado de App. Va dentro de AuthProvider, que ya
    // envuelve a App entera, así que useAuth() funciona en su interior.
    <FavoritosProvider alPedirSesion={pedirLogin}>
      <CardNav
        logo="/favicon.png"
        logoAlt="Buscador de películas y series"
        logoText="Buscador"
        items={itemsNav}
        ctaLabel={usuario ? 'Salir' : 'Entrar'}
        ctaIcon={usuario ? IconoSalir : IconoEntrar}
        onCtaClick={usuario ? () => setConfirmarSalir(true) : () => setModalAuth('login')}
        onLogoClick={() => setVista('buscar')}
        topRightExtra={<ThemeToggle />}
      />

      {/* el `key` cambia al alternar vista → el div se remonta y dispara la
          animación de entrada (no cambia al teclear, así no se reanima en
          cada búsqueda) */}
      <div className="vista" key={vistaEfectiva}>
        {vistaEfectiva === 'favoritos' ? (
          <Favorites onSelect={setSelected} />
        ) : vistaEfectiva === 'buscar' ? (
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

            {/* sin texto: orbit decorativo de pósters; con texto: resultados */}
            {query.trim() ? (
              <Resultados titles={resultados} onSelect={setSelected} />
            ) : (
              <OrbitImages />
            )}
          </>
        ) : (
          <Descubrir onSelect={setSelected} />
        )}
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
