// CardNav de React Bits (reactbits.dev), adaptado a este proyecto:
// - la flecha de los enlaces es un SVG propio (evita la dependencia react-icons)
// - los enlaces aceptan onClick además de href, y el menú se pliega al elegir uno
// - el botón CTA es configurable (ctaLabel / onCtaClick) en vez del "Get Started" fijo
// - logoText opcional junto a la imagen del logo
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './CardNav.css';

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
);

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  logoText,
  items,
  className = '',
  ease = 'power3.out',
  baseColor = 'var(--bg)',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  ctaLabel,
  onCtaClick
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    // Si los items cambian (p. ej. al iniciar/cerrar sesión), la timeline se
    // recrea colapsada: hay que re-sincronizarla con el estado de React. Sin
    // esto, si la recreación pillaba el cierre animado a medias, su
    // onReverseComplete moría con la timeline vieja, isExpanded se quedaba en
    // true y la hamburguesa ya no podía volver a abrir el menú.
    if (isHamburgerOpen) {
      tl?.progress(1);
    } else if (isExpanded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resincronización puntual y poco frecuente, no un patrón de render
      setIsExpanded(false);
    }

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    // La rama se decide por la intención (lo que muestra el icono de la
    // hamburguesa), no por isExpanded: isExpanded sigue en true durante todo
    // el cierre animado, y con él un clic a mitad de cierre "se tragaba" la
    // pulsación (re-cerraba en vez de abrir). play()/reverse() sin argumentos
    // continúan desde donde esté la animación, así el cambio de sentido es suave.
    if (!isHamburgerOpen) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play();
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  // al elegir una opción del menú, ejecuta su acción y pliega el nav
  const handleLinkClick = lnk => () => {
    lnk.onClick?.();
    if (isExpanded) toggleMenu();
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Cerrar menú' : 'Abrir menú'}
            tabIndex={0}
            style={{ color: menuColor || 'var(--text-h)' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            {logo && <img src={logo} alt={logoAlt} className="logo" />}
            {logoText && <span className="logo-text">{logoText}</span>}
          </div>

          {ctaLabel && (
            <button
              type="button"
              className="card-nav-cta-button"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
              onClick={onCtaClick}
            >
              {ctaLabel}
            </button>
          )}
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) =>
                  // con href es un enlace normal; con onClick, un botón (login, logout...)
                  lnk.href ? (
                    <a
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      href={lnk.href}
                      target={lnk.target}
                      rel={lnk.target === '_blank' ? 'noreferrer' : undefined}
                      aria-label={lnk.ariaLabel}
                    >
                      <ArrowIcon className="nav-card-link-icon" />
                      {lnk.label}
                    </a>
                  ) : (
                    <button
                      key={`${lnk.label}-${i}`}
                      type="button"
                      className="nav-card-link"
                      onClick={handleLinkClick(lnk)}
                      aria-label={lnk.ariaLabel}
                    >
                      <ArrowIcon className="nav-card-link-icon" />
                      {lnk.label}
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
