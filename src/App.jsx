import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Card from './components/Card/Card.jsx'
import Detail from './components/Detail/Detail.jsx'
import BlurText from './components/BlurText/BlurText.jsx'
import CardNav from './components/CardNav/CardNav.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import { TmdbApi } from './api/TmdbApi.js'
import { useDebounce } from './hooks/useDebounce.js'

const tmdb = new TmdbApi()

function App() {
  const { usuario, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [titles, setTitles] = useState([])
  const [selected, setSelected] = useState(null) // title abierto en detalle
  const [modalAuth, setModalAuth] = useState(null) // null | 'login' | 'registro'

  // query "retrasado": solo cambia 400ms después de la última tecla
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    // sin búsqueda → mostramos los titles en tendencia
    if (!debouncedQuery.trim()) {
      tmdb.getTrending().then(setTitles)
      return
    }
    tmdb.searchTitles(debouncedQuery).then(setTitles)
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
        { label: 'Tendencias', onClick: () => setQuery(''), ariaLabel: 'Ver tendencias' },
        { label: 'TMDB', href: 'https://www.themoviedb.org/', target: '_blank' },
      ],
    },
    usuario
      ? {
          label: 'Cuenta',
          bgColor: 'var(--accent)',
          textColor: '#fff',
          links: [{ label: 'Cerrar sesión', onClick: logout }],
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
    <>
      <CardNav
        logo="/favicon.svg"
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

      <input
        className="search-input"
        placeholder="Introduce lo que quieres buscar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="cards-grid">
        {titles.map((t) => (
          <Card key={t.id} title={t} onClick={setSelected} />
        ))}
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

      {/* atribución requerida por los términos de uso de la API de TMDB */}
      <footer className="tmdb-footer">
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          <img className="tmdb-logo" src="/tmdbLogo.svg" alt="The Movie Database (TMDB)" />
        </a>
        <p>
          Este producto usa la API de TMDB, pero no está avalado ni certificado por TMDB.
        </p>
      </footer>
    </>
  )
}

export default App
