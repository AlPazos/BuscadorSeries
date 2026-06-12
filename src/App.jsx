import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import Card from './components/Card/Card.jsx'
import Detail from './components/Detail/Detail.jsx'
import BlurText from './components/BlurText/BlurText.jsx'
import CardNav from './components/CardNav/CardNav.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import { FavoritosProvider, useFavoritos } from './favoritos/FavoritosContext.jsx'
import Favorites from './components/Favorites/Favorites.jsx'
import { TmdbApi } from './api/TmdbApi.js'
import { useDebounce } from './hooks/useDebounce.js'

const tmdb = new TmdbApi()

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
        {titles.map((t) => (
          // los ids de TMDB son únicos POR TIPO (una película y una serie
          // pueden compartir id): la key necesita el tipo para no colisionar
          <Card key={`${t.type}-${t.id}`} title={t} onClick={onSelect} />
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
  const [vista, setVista] = useState('explorar') // 'explorar' | 'favoritos'

  // la vista de favoritos solo tiene sentido con sesión: si caduca o se
  // cierra, se vuelve a explorar sin tener que sincronizar nada a mano
  const enFavoritos = vista === 'favoritos' && usuario != null

  // useCallback: identidad estable entre renders; si fuera un arrow inline,
  // el value memoizado de FavoritosProvider se invalidaría en cada render
  // de App y los corazones se re-renderizarían sin necesidad
  const pedirLogin = useCallback(() => setModalAuth('login'), [])

  // query "retrasado": solo cambia 400ms después de la última tecla
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    // `cancelado` evita una condición de carrera: si la búsqueda cambia con
    // una petición aún en vuelo, su respuesta (que puede llegar DESPUÉS que
    // la de la búsqueda nueva) se descarta en vez de pisar los resultados
    let cancelado = false
    const peticion = debouncedQuery.trim()
      ? tmdb.searchTitles(debouncedQuery)
      : tmdb.getTrending() // sin búsqueda → los titles en tendencia
    peticion
      .then((lista) => !cancelado && setTitles(lista))
      .catch(() => {}) // TMDB caído: se conserva lo que hubiera en pantalla
    return () => {
      cancelado = true
    }
  }, [debouncedQuery])

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
          label: 'Tendencias',
          onClick: () => {
            setQuery('')
            setVista('explorar')
          },
          ariaLabel: 'Ver tendencias',
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
            { label: 'Cerrar sesión', onClick: logout },
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
  ], [usuario, logout])

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
        onCtaClick={usuario ? logout : () => setModalAuth('login')}
      />

      <BlurText
        as="h1"
        text="Buscador de películas y series"
        animateBy="words"
        direction="top"
        delay={150}
      />

      {enFavoritos ? (
        <Favorites onSelect={setSelected} />
      ) : (
        <>
          <input
            className="search-input"
            placeholder="Introduce lo que quieres buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Resultados titles={titles} onSelect={setSelected} />
        </>
      )}

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
