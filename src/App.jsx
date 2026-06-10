import { useEffect, useState } from 'react'
import './App.css'
import Card from './components/Card/Card.jsx'
import Detail from './components/Detail/Detail.jsx'
import BlurText from './components/BlurText/BlurText.jsx'
import { TmdbApi } from './api/TmdbApi.js'
import { useDebounce } from './hooks/useDebounce.js'

const tmdb = new TmdbApi()

function App() {
  const [query, setQuery] = useState('')
  const [titles, setTitles] = useState([])
  const [selected, setSelected] = useState(null) // title abierto en detalle

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

  return (
    <>
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
    </>
  )
}

export default App
