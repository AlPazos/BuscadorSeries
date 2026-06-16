import { useState, useEffect, useRef } from 'react'
import './TopNav.css'

// flecha "↗" de los enlaces (sustituye al GoArrowUpRight de react-icons del original)
const ArrowIcon = props => (
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
  </svg>
)

// Componente interno para los dropdowns
function Dropdown({ label, links, onNavigate }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false)
      }
    }

    const handleTecla = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false)
      }
    }

    document.addEventListener('pointerdown', handleClickFuera)
    document.addEventListener('keydown', handleTecla)

    return () => {
      document.removeEventListener('pointerdown', handleClickFuera)
      document.removeEventListener('keydown', handleTecla)
    }
  }, [])

  return (
    <div className="topnav-dropdown-container" ref={ref}>
      <button
        className="topnav-trigger"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto(v => !v)}
      >
        {label}
        <ArrowIcon />
      </button>
      <div className={`topnav-dropdown ${abierto ? 'abierto' : ''}`} role="menu">
        {links.map((link, i) => {
          const cerrar = () => {
            onNavigate?.()
            setAbierto(false)
          }
          // enlace con href → todo el ítem es <a> (antes solo navegaba la flecha)
          return link.href ? (
            <a
              key={i}
              href={link.href}
              target={link.target}
              rel={link.target === '_blank' ? 'noreferrer' : undefined}
              className="topnav-dropdown-item"
              role="menuitem"
              onClick={cerrar}
            >
              {link.label}
              <ArrowIcon />
            </a>
          ) : (
            <button
              key={i}
              type="button"
              className="topnav-dropdown-item"
              role="menuitem"
              onClick={() => {
                link.onClick?.()
                cerrar()
              }}
            >
              {link.label}
              <ArrowIcon />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TopNav({
  items,
  logo,
  logoText,
  onLogoClick,
  ctaLabel,
  ctaIcon,
  onCtaClick,
  extra
}) {
  const [menuMovil, setMenuMovil] = useState(false)

  // con el menú móvil abierto, bloquea el scroll de la página de debajo
  useEffect(() => {
    if (!menuMovil) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [menuMovil])

  const cerrarMenu = () => setMenuMovil(false)

  return (
    <header className={`topnav ${menuMovil ? 'topnav--abierto' : ''}`}>
      <div className="topnav-left">
        {onLogoClick ? (
          <button
            type="button"
            className="topnav-logo"
            onClick={onLogoClick}
            aria-label="Ir a inicio"
          >
            <img src={logo} alt="Logo" className="logo" />
            {logoText && <span className="logo-text">{logoText}</span>}
          </button>
        ) : (
          <div className="topnav-logo">
            <img src={logo} alt="Logo" className="logo" />
            {logoText && <span className="logo-text">{logoText}</span>}
          </div>
        )}
      </div>

      <nav className="topnav-nav" aria-label="Navegación">
        {items.map((item, index) => (
          <div key={index} className="topnav-item">
            {item.links ? (
              <Dropdown
                label={item.label}
                links={item.links}
                onNavigate={cerrarMenu}
              />
            ) : (
              <button
                className={`topnav-link ${item.active ? 'active' : ''}`}
                aria-current={item.active ? 'page' : undefined}
                onClick={() => { item.onClick?.(); cerrarMenu() }}
              >
                {item.icon && <span className="topnav-icon">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
        <div className="topnav-right">
          {extra}
          <button
            type="button"
            className="card-nav-cta-button"
            onClick={() => { onCtaClick?.(); cerrarMenu() }}
          >
            {ctaIcon}
            {ctaLabel}
          </button>
        </div>
      </nav>

      <button
        className="topnav-burger"
        aria-label="Menú"
        aria-expanded={menuMovil}
        onClick={() => setMenuMovil(v => !v)}
      >
        <span className={`hamburger-line ${menuMovil ? 'abierto' : ''}`} />
        <span className={`hamburger-line ${menuMovil ? 'abierto' : ''}`} />
      </button>
    </header>
  )
}