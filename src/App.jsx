import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — CSS Variables & Constants
// ═══════════════════════════════════════════════════════════════════════════
const CSS_VARS = `
  :root {
    --gold: #C9A84C;
    --gold-light: #E4C97A;
    --gold-dark: #A68A3A;
    --gold-glow: rgba(201, 168, 76, 0.35);
    --gold-subtle: rgba(201, 168, 76, 0.12);
    --dark: #0A0A0A;
    --dark-elevated: #121212;
    --dark-card: #1A1A1A;
    --charcoal: #1C1C1C;
    --charcoal-light: #242424;
    --cream: #F8F5EF;
    --cream-warm: #F0EBE2;
    --white: #FFFFFF;
    --white-90: rgba(255, 255, 255, 0.9);
    --white-70: rgba(255, 255, 255, 0.7);
    --white-50: rgba(255, 255, 255, 0.5);
    --white-30: rgba(255, 255, 255, 0.3);
    --white-10: rgba(255, 255, 255, 0.1);
    --white-05: rgba(255, 255, 255, 0.05);
    --text-primary: #1A1A1A;
    --text-secondary: #555555;
    --text-muted: #888888;
    --glass-bg: rgba(10, 10, 10, 0.72);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-border-hover: rgba(201, 168, 76, 0.3);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.12);
    --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.16);
    --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.24);
    --shadow-gold: 0 8px 32px rgba(201, 168, 76, 0.2);
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --radius-xl: 28px;
    --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    --font-serif: 'Playfair Display', 'Georgia', serif;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;

const GOLD = "var(--gold)";
const DARK = "var(--dark)";
const CHARCOAL = "var(--charcoal)";
const CREAM = "var(--cream)";

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(element);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(element);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
};

const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return progress;
};

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const handler = (e) => setMatches(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
};

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE ANIMATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
const FadeIn = ({ children, delay = 0, className = "", direction = "up" }) => {
  const [ref, inView] = useInView();
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
    none: { y: 0, x: 0 }
  };
  const d = directions[direction] || directions.up;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translate3d(0, 0, 0)" : `translate3d(${d.x}px, ${d.y}px, 0)`,
        transition: `opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
        willChange: "opacity, transform"
      }}
    >
      {children}
    </div>
  );
};

const MagneticButton = ({ children, href, onClick, className = "", style = {} }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleMouseMove = useCallback((e) => {
    if (isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    setPosition({ x, y });
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const sharedProps = {
    ref,
    className,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: {
      ...style,
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    }
  };

  if (href) {
    return <a href={href} {...sharedProps}>{children}</a>;
  }
  return <button onClick={onClick} {...sharedProps}>{children}</button>;
};

// ═══════════════════════════════════════════════════════════════════════════
// DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
const GoldDivider = ({ className = "" }) => (
  <div className={`gold-divider ${className}`} style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0 auto 2.5rem", maxWidth: 160 }}>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0.5 }} />
    <div style={{ width: 6, height: 6, background: "var(--gold)", transform: "rotate(45deg)", borderRadius: 1 }} />
    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0.5 }} />
  </div>
);

const SectionLabel = ({ children }) => (
  <p style={{
    color: GOLD,
    fontFamily: "var(--font-sans)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    marginBottom: "0.75rem",
    textAlign: "center",
    opacity: 0.9
  }}>
    {children}
  </p>
);

const SectionTitle = ({ children, light }) => (
  <h2 style={{
    fontFamily: "var(--font-serif)",
    fontSize: "clamp(2rem, 5vw, 3.2rem)",
    fontWeight: 700,
    color: light ? "var(--white)" : "var(--text-primary)",
    textAlign: "center",
    marginBottom: "0.75rem",
    lineHeight: 1.15,
    letterSpacing: "-0.02em"
  }}>
    {children}
  </h2>
);

// ═══════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════════════
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = ["about", "products", "why-us", "gallery", "testimonials", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -60% 0px" }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const links = [
    { label: "About", id: "about" },
    { label: "Products", id: "products" },
    { label: "Why Us", id: "why-us" },
    { label: "Gallery", id: "gallery" },
    { label: "Testimonials", id: "testimonials" },
    { label: "Contact", id: "contact" }
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? "rgba(10, 10, 10, 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.2)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.2)" : "none",
          borderBottom: scrolled ? "1px solid var(--glass-border)" : "none",
          transition: "all var(--transition-base)",
          padding: "0 5%"
        }}
      >
        {/* Scroll Progress Bar */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          width: `${scrollProgress * 100}%`,
          background: "linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light))",
          transition: "width 0.1s linear",
          opacity: scrolled ? 1 : 0
        }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: scrolled ? 72 : 84, transition: "height var(--transition-base)" }}>
          {/* Logo */}
          <MagneticButton
            href="#"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="nav-logo"
            style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textDecoration: "none" }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              border: "1px solid rgba(201,168,76,0.3)",
              background: "var(--dark-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img
                src="/logo.jpeg"
                alt="Roshan Tiles And Granites"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            <div style={{ lineHeight: 1.15, display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "var(--font-serif)", color: GOLD, fontSize: "1.35rem", fontWeight: 700, letterSpacing: "0.04em" }}>ROSHAN</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", letterSpacing: "0.22em", color: "var(--white-50)", textTransform: "uppercase" }}>Tiles & Granites</span>
            </div>
          </MagneticButton>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                aria-current={activeSection === l.id ? "page" : undefined}
                style={{
                  background: "none",
                  border: "none",
                  color: activeSection === l.id ? "var(--gold)" : "var(--white-70)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  padding: "6px 0",
                  position: "relative",
                  transition: "color var(--transition-fast)"
                }}
                onMouseEnter={(e) => { if (activeSection !== l.id) e.target.style.color = "var(--gold-light)"; }}
                onMouseLeave={(e) => { if (activeSection !== l.id) e.target.style.color = "var(--white-70)"; }}
              >
                {l.label}
                {activeSection === l.id && (
                  <span style={{
                    position: "absolute",
                    bottom: -2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--gold)",
                    transition: "all var(--transition-fast)"
                  }} />
                )}
              </button>
            ))}
            <MagneticButton
              href="tel:+918390599247"
              className="gold-glow-btn"
              style={{
                background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                color: DARK,
                padding: "10px 24px",
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textDecoration: "none",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span style={{ fontSize: "1rem" }}>📞</span> Call Now
            </MagneticButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="mobile-menu-btn"
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--white)",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: 8,
              borderRadius: "var(--radius-sm)",
              transition: "background var(--transition-fast)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--white-05)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ display: "inline-block", transition: "transform var(--transition-base)" }}>
              {menuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className="mobile-menu"
          style={{
            maxHeight: menuOpen ? 400 : 0,
            overflow: "hidden",
            transition: "max-height var(--transition-slow)",
            background: "rgba(10, 10, 10, 0.98)",
            backdropFilter: "blur(20px)"
          }}
        >
          <div style={{ padding: "1rem 5%" }}>
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  color: activeSection === l.id ? "var(--gold)" : "var(--white-90)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem",
                  fontWeight: activeSection === l.id ? 600 : 400,
                  padding: "14px 0",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--white-05)",
                  transition: "color var(--transition-fast)"
                }}
              >
                {l.label}
              </button>
            ))}
            <a
              href="tel:+918390599247"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                color: DARK,
                padding: "14px 0",
                textAlign: "center",
                fontWeight: 700,
                textDecoration: "none",
                marginTop: 16,
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem"
              }}
            >
              📞 +91 8390599247
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════
function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  return (
    <section
      role="banner"
      aria-label="Hero section"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: DARK,
        overflow: "hidden"
      }}
    >
      {/* Animated Background Layers */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(201,168,76,0.05) 0%, transparent 50%)"
      }} />

      {/* Split logo background with parallax */}
      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: 0.2,
        transform: `translate3d(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px, 0)`,
        transition: "transform 0.3s ease-out"
      }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ backgroundImage: "url('/logo.jpeg')", backgroundRepeat: "no-repeat", backgroundSize: "200% 100%", backgroundPosition: "left center", filter: "contrast(1.1) saturate(1.1) brightness(0.6)" }} />
          <div style={{ backgroundImage: "url('/logo.jpeg')", backgroundRepeat: "no-repeat", backgroundSize: "200% 100%", backgroundPosition: "right center", filter: "contrast(1.1) saturate(1.1) brightness(0.6)" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.2) 50%, rgba(10,10,10,0.5) 100%)" }} />
      </div>

      {/* Floating particles */}
      <div className="particles" aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 2 + i * 0.5,
            height: 2 + i * 0.5,
            borderRadius: "50%",
            background: "var(--gold)",
            opacity: 0.15 - i * 0.02,
            left: `${15 + i * 15}%`,
            top: `${20 + i * 12}%`,
            animation: `floatParticle ${8 + i * 2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.8}s`
          }} />
        ))}
      </div>

      {/* Gold gradient accent */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "45%",
        height: "100%",
        background: "linear-gradient(135deg, transparent 30%, rgba(201,168,76,0.04) 100%)",
        pointerEvents: "none"
      }} />

      {/* Vertical gold line */}
      <div style={{
        position: "absolute",
        left: "5%",
        top: "15%",
        bottom: "15%",
        width: 1,
        background: "linear-gradient(to bottom, transparent, var(--gold), transparent)",
        opacity: 0.3
      }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "120px 5% 80px", width: "100%" }}>
        <div style={{ maxWidth: 680 }}>
          <FadeIn>
            <p style={{
              color: GOLD,
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span style={{ width: 24, height: 1, background: GOLD, opacity: 0.6 }} />
              Lohgaon, Pune · Established Showroom
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.6rem, 7vw, 4.8rem)",
              fontWeight: 700,
              color: "var(--white)",
              lineHeight: 1.08,
              marginBottom: "1.5rem",
              letterSpacing: "-0.03em"
            }}>
              Premium Tiles,<br />
              <span style={{ color: GOLD, position: "relative" }}>
                Granite & Marble
                <svg style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 8 }} viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0,6 Q50,0 100,6 T200,6" stroke="var(--gold)" strokeWidth="2" fill="none" opacity="0.4" />
                </svg>
              </span><br />
              Solutions for Every Space
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.1rem",
              color: "var(--white-50)",
              lineHeight: 1.8,
              marginBottom: "2.5rem",
              maxWidth: 520
            }}>
              Transform your home and commercial projects with high-quality tiles, granite, marble, and natural stone products curated for Pune's finest spaces.
            </p>
          </FadeIn>

          <FadeIn delay={0.45}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "3rem" }}>
              <MagneticButton
                href="tel:+918390599247"
                className="gold-glow-btn"
                style={{
                  background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                  color: DARK,
                  padding: "16px 36px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  letterSpacing: "0.1em",
                  textDecoration: "none",
                  borderRadius: "var(--radius-sm)",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(201,168,76,0.3)"
                }}
              >
                <span>📞</span> Call Now
              </MagneticButton>
              <MagneticButton
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="hover-lift"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "var(--white)",
                  padding: "16px 36px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                  textTransform: "uppercase",
                  backdropFilter: "blur(10px)",
                  transition: "all var(--transition-base)"
                }}
              >
                Visit Our Showroom
              </MagneticButton>
            </div>
          </FadeIn>

          <FadeIn delay={0.6}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem 1.5rem",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              backdropFilter: "blur(10px)",
              width: "fit-content"
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                flexShrink: 0
              }}>
                📞
              </div>
              <div>
                <p style={{ color: "var(--white-50)", fontFamily: "var(--font-sans)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2 }}>Direct Line</p>
                <a href="tel:+918390599247" style={{ color: GOLD, fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 700, textDecoration: "none", letterSpacing: "0.02em" }}>+91 8390599247</a>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Floating image mosaic with glassmorphism */}
        <div className="hero-mosaic" style={{
          position: "absolute",
          right: "2%",
          top: "12%",
          bottom: "8%",
          width: "38%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          gap: 10,
          opacity: 0.9,
          animation: "floatY 8s ease-in-out infinite"
        }}>
          <div style={{ gridRow: "1/3", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
            <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80" alt="Marble interior" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }} loading="lazy" />
          </div>
          <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
            <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80" alt="Tile" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          </div>
          <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" alt="Granite" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          </div>
          <div style={{ gridColumn: "1/3", borderRadius: "var(--radius-md)", overflow: "hidden", border: "2px solid rgba(201,168,76,0.3)" }}>
            <img src="https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80" alt="Luxury floor" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        cursor: "pointer"
      }} onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>
        <p style={{ color: "var(--white-30)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>Scroll</p>
        <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, var(--gold), transparent)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "40%", background: "var(--gold)", animation: "scrollPulse 2s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════════════════════════
function StatsBar() {
  const stats = [
    ["500+", "Products"],
    ["10+", "Years Experience"],
    ["1000+", "Happy Customers"],
    ["Pune", "Service Area"]
  ];

  return (
    <div style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 5%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", position: "relative", zIndex: 1 }} className="stats-grid">
        {stats.map(([num, label], i) => (
          <FadeIn key={label} delay={i * 0.1}>
            <div style={{
              padding: "36px 20px",
              textAlign: "center",
              borderRight: i < 3 ? "1px solid rgba(10,10,10,0.1)" : "none"
            }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "2.4rem", fontWeight: 700, color: DARK, margin: 0, lineHeight: 1 }}>{num}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600, color: "rgba(10,10,10,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "8px 0 0" }}>{label}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT SECTION
// ═══════════════════════════════════════════════════════════════════════════
function About() {
  return (
    <section id="about" style={{ padding: "120px 5%", background: CREAM, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.04) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }} className="about-grid">
        <FadeIn direction="left">
          <div style={{ position: "relative" }}>
            <div style={{
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              aspectRatio: "4/5",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid rgba(201,168,76,0.15)"
            }}>
              <img src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80" alt="Tile showroom interior" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            </div>
            <div style={{
              position: "absolute",
              bottom: -20,
              right: -20,
              background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
              padding: "28px 32px",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-gold)",
              zIndex: 2
            }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "2.8rem", fontWeight: 700, color: DARK, margin: 0, lineHeight: 1 }}>10+</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 600, color: "rgba(10,10,10,0.6)", letterSpacing: "0.15em", textTransform: "uppercase", margin: "6px 0 0" }}>Years of Trust</p>
            </div>
            <div style={{
              position: "absolute",
              top: 32,
              left: -16,
              width: 100,
              height: 240,
              border: "2px solid rgba(201,168,76,0.3)",
              borderRight: "none",
              borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
              zIndex: -1
            }} />
          </div>
        </FadeIn>

        <FadeIn delay={0.2} direction="right">
          <SectionLabel>About Us</SectionLabel>
          <SectionTitle>Pune's Trusted Stone & Tile Destination</SectionTitle>
          <div style={{ width: 60, height: 3, background: "linear-gradient(90deg, var(--gold), var(--gold-dark))", margin: "0 auto 1.5rem", borderRadius: 2 }} />
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.9, marginBottom: "1.2rem" }}>
            Roshan Tiles And Granites is a trusted supplier of premium tiles, granite, marble, and natural stone products in Lohgaon, Pune. We offer a wide range of floor tiles, wall tiles, vitrified tiles, ceramic tiles, granite slabs, marble, and decorative stone solutions for residential and commercial projects.
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.9, marginBottom: "2rem" }}>
            Our commitment is to provide quality products, competitive pricing, and excellent customer service — helping you find the perfect materials to bring your vision to life.
          </p>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {["Floor & Wall Tiles", "Granite Slabs", "Marble Collection", "Natural Stone"].map((tag) => (
              <div key={tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", transform: "rotate(45deg)", flexShrink: 0, borderRadius: 2 }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", color: CHARCOAL, fontWeight: 500 }}>{tag}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTS SECTION
// ═══════════════════════════════════════════════════════════════════════════
const products = [
  { name: "Floor Tiles", desc: "Durable and elegant floor tiles for every room", img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80" },
  { name: "Wall Tiles", desc: "Decorative wall tiles to elevate interiors", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80" },
  { name: "Vitrified Tiles", desc: "Low-maintenance, high-gloss vitrified options", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80" },
  { name: "Ceramic Tiles", desc: "Classic ceramic tiles for timeless design", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { name: "Granite Slabs", desc: "Premium granite for countertops and surfaces", img: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80" },
  { name: "Marble Collection", desc: "Luxurious marble for an opulent aesthetic", img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80" },
  { name: "Natural Stone", desc: "Authentic stone textures for unique spaces", img: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80" },
  { name: "Designer Tiles", desc: "Contemporary designer tiles for modern homes", img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80" }
];

function Products() {
  const [hovered, setHovered] = useState(null);

  return (
    <section id="products" style={{ padding: "120px 5%", background: DARK, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <SectionLabel>Our Products</SectionLabel>
          <SectionTitle light>Explore Our Collection</SectionTitle>
          <p style={{ textAlign: "center", fontFamily: "var(--font-sans)", color: "var(--white-50)", fontSize: "1.05rem", marginBottom: "1rem" }}>
            Curated premium materials for every vision and budget
          </p>
          <GoldDivider />
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1.5rem" }}>
          {products.map((p, i) => (
            <FadeIn key={p.name} delay={i * 0.06}>
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                role="article"
                aria-label={p.name}
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: `1px solid ${hovered === i ? "rgba(201,168,76,0.4)" : "var(--glass-border)"}`,
                  transition: "all var(--transition-base)",
                  aspectRatio: "3/4",
                  background: "var(--dark-card)",
                  boxShadow: hovered === i ? "var(--shadow-gold), 0 0 40px rgba(201,168,76,0.1)" : "none"
                }}
              >
                <img
                  src={p.img}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    filter: "brightness(1.05) contrast(1.05)",
                    transform: hovered === i ? "scale(1.08)" : "scale(1)",
                    transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease"
                  }}
                  loading="lazy"
                />
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: hovered === i
                    ? "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.2) 100%)"
                    : "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.3) 50%, transparent 100%)",
                  transition: "background var(--transition-base)"
                }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.75rem" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8, opacity: 0.9 }}>Premium Quality</p>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", color: "var(--white)", marginBottom: 8, fontWeight: 600 }}>{p.name}</h3>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--white-50)", lineHeight: 1.6, marginBottom: hovered === i ? 16 : 0, transition: "margin var(--transition-base)" }}>{p.desc}</p>
                  {hovered === i && (
                    <a
                      href="tel:+918390599247"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 4,
                        background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                        color: DARK,
                        padding: "10px 22px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textDecoration: "none",
                        borderRadius: "var(--radius-sm)",
                        animation: "fadeSlideUp 0.4s ease"
                      }}
                    >
                      Enquire Now →
                    </a>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WHY US SECTION
// ═══════════════════════════════════════════════════════════════════════════
const whyUs = [
  { icon: "🏆", title: "Premium Quality Materials", desc: "Only the finest tiles, granite, and marble sourced from trusted manufacturers." },
  { icon: "🎨", title: "Wide Product Selection", desc: "Hundreds of designs, textures, and finishes to match any style or budget." },
  { icon: "💰", title: "Competitive Pricing", desc: "Factory-direct pricing ensures you get the best value without compromise." },
  { icon: "🧑‍💼", title: "Expert Guidance", desc: "Our experienced team helps you choose the right materials for your project." },
  { icon: "⭐", title: "Trusted by Customers", desc: "Over 1,000 satisfied customers across Pune and surrounding areas." },
  { icon: "🏠", title: "Modern Designs", desc: "Stay ahead with the latest trends in tile and stone design." },
  { icon: "⚡", title: "Fast Service", desc: "Quick turnaround and prompt delivery to keep your project on schedule." },
  { icon: "🤝", title: "Reliable Supplier", desc: "Consistent stock availability and dependable after-sales support." }
];

function WhyUs() {
  return (
    <section id="why-us" style={{ padding: "120px 5%", background: CREAM, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.04) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <SectionLabel>Why Choose Us</SectionLabel>
          <SectionTitle>The Roshan Difference</SectionTitle>
          <p style={{ textAlign: "center", fontFamily: "var(--font-sans)", color: "var(--text-muted)", marginBottom: "1rem", fontSize: "1.05rem" }}>Eight reasons thousands of Pune homeowners choose us</p>
          <GoldDivider />
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {whyUs.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.05}>
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid rgba(201,168,76,0.12)",
                  borderRadius: "var(--radius-md)",
                  padding: "2.25rem 1.75rem",
                  transition: "all var(--transition-base)",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                  e.currentTarget.style.boxShadow = "var(--shadow-gold), 0 0 40px rgba(201,168,76,0.06)";
                  e.currentTarget.style.transform = "translateY(-6px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background: "radial-gradient(circle at top right, rgba(201,168,76,0.06), transparent 70%)"
                }} />
                <div style={{ fontSize: "2.2rem", marginBottom: "1.25rem", display: "inline-block" }}>{item.icon}</div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--text-primary)", marginBottom: "0.6rem", fontWeight: 600 }}>{item.title}</h3>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GALLERY SECTION
// ═══════════════════════════════════════════════════════════════════════════
const galleryImgs = [
  { src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80", label: "Marble Interior", span: "2" },
  { src: "https://images.unsplash.com/photo-1620626011761-996317702519?w=400&q=80", label: "Luxury Flooring" },
  { src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80", label: "Modern Bathroom" },
  { src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80", label: "Tile Display" },
  { src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80", label: "Granite Slab" },
  { src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80", label: "Kitchen Countertop", span: "2" }
];

function Gallery() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  return (
    <section id="gallery" style={{ padding: "120px 5%", background: CHARCOAL, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 80%, rgba(201,168,76,0.04) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <SectionLabel>Gallery</SectionLabel>
          <SectionTitle light>Inspiring Spaces</SectionTitle>
          <GoldDivider />
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="gallery-grid">
          {galleryImgs.map((img, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div
                role="button"
                tabIndex={0}
                aria-label={`View ${img.label}`}
                onClick={() => setLightbox(img)}
                onKeyDown={(e) => e.key === "Enter" && setLightbox(img)}
                style={{
                  gridColumn: img.span ? `span ${img.span}` : "span 1",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  position: "relative",
                  aspectRatio: img.span ? "2/1" : "1/1",
                  cursor: "pointer",
                  border: `1px solid ${hoveredCard === i ? "rgba(201,168,76,0.6)" : "var(--glass-border)"}`,
                  boxShadow: hoveredCard === i ? "var(--shadow-gold), 0 0 40px rgba(201,168,76,0.1)" : "none",
                  transition: "all var(--transition-base)"
                }}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo.jpeg"; }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: hoveredCard === i ? "scale(1.1)" : "scale(1)",
                    filter: hoveredCard === i ? "brightness(1.05) contrast(1.05)" : "brightness(0.96)",
                    transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s ease"
                  }}
                />
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: hoveredCard === i
                    ? "linear-gradient(to top, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.2) 65%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                  transition: "background var(--transition-base)"
                }} />
                <p style={{
                  position: "absolute",
                  bottom: hoveredCard === i ? 24 : 18,
                  left: 20,
                  fontFamily: "var(--font-serif)",
                  color: "var(--white)",
                  fontSize: "1rem",
                  margin: 0,
                  letterSpacing: "0.02em",
                  transition: "bottom var(--transition-base)"
                }}>{img.label}</p>
                {hoveredCard === i && (
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(201,168,76,0.2)",
                    border: "1px solid rgba(201,168,76,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    animation: "fadeIn 0.3s ease"
                  }}>
                    🔍
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10,10,10,0.95)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            animation: "fadeIn 0.3s ease"
          }}
        >
          <button
            aria-label="Close preview"
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "none",
              border: "1px solid var(--glass-border)",
              color: "var(--white)",
              fontSize: "1.5rem",
              width: 48,
              height: 48,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.label}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--glass-border)"
            }}
          />
          <p style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "var(--font-serif)",
            color: "var(--white)",
            fontSize: "1.2rem"
          }}>{lightbox.label}</p>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTIMONIALS SECTION
// ═══════════════════════════════════════════════════════════════════════════
const testimonials = [
  { name: "Rajesh Kulkarni", role: "Homeowner, Kharadi", text: "Roshan Tiles helped us pick the perfect marble flooring for our new flat. The quality is outstanding and the pricing was very reasonable. Highly recommended for anyone renovating in Pune!", rating: 5 },
  { name: "Priya Sharma", role: "Interior Designer, Pune", text: "I regularly source tiles for my clients from Roshan Tiles & Granites. They have a huge variety, the staff is knowledgeable, and delivery is always on time. My go-to showroom in Lohgaon.", rating: 5 },
  { name: "Anil Deshmukh", role: "Builder, Viman Nagar", text: "Used their granite slabs for a commercial project and the results were fantastic. Competitive rates for bulk orders and excellent customer service from start to finish.", rating: 5 },
  { name: "Sneha Joshi", role: "Homeowner, Lohgaon", text: "The showroom has an amazing collection of designer tiles. We were spoilt for choice! The team guided us patiently and we found exactly what we needed for our kitchen.", rating: 5 }
];

function Testimonials() {
  const marqueeTestimonials = [...testimonials, ...testimonials];
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section id="testimonials" style={{ padding: "120px 5%", background: CREAM, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.03) 0%, transparent 70%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <SectionLabel>Customer Reviews</SectionLabel>
          <SectionTitle>What Our Clients Say</SectionTitle>
          <GoldDivider />
        </FadeIn>
        <div style={{ overflow: "hidden", position: "relative" }}>
          {/* Gradient fade edges */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, var(--cream), transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, var(--cream), transparent)", zIndex: 2, pointerEvents: "none" }} />

          <div
            className="testimonials-track"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
              display: "flex",
              gap: "1.5rem",
              width: "max-content",
              animation: isPaused ? "none" : "testimonialsMarquee 36s linear infinite"
            }}
          >
            {marqueeTestimonials.map((t, i) => (
              <div key={`${t.name}-${i}`} style={{
                background: "var(--white)",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "var(--radius-md)",
                padding: "2.25rem",
                width: 340,
                maxWidth: "80vw",
                flex: "0 0 auto",
                transition: "all var(--transition-base)",
                cursor: "default"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                e.currentTarget.style.boxShadow = "var(--shadow-gold), 0 0 30px rgba(201,168,76,0.06)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: "1.25rem" }}>
                  {[...Array(t.rating)].map((_, j) => <span key={j} style={{ color: GOLD, fontSize: "1.1rem" }}>★</span>)}
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "1.75rem", fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ borderTop: "1px solid rgba(201,168,76,0.12)", paddingTop: "1.25rem", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    color: DARK,
                    fontSize: "1.1rem",
                    flexShrink: 0
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--text-primary)", margin: 0, fontWeight: 600 }}>{t.name}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CTA BAND
// ═══════════════════════════════════════════════════════════════════════════
function CTABand() {
  return (
    <section style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", padding: "80px 5%", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(10,10,10,0.5)", marginBottom: 16 }}>Ready to Transform Your Space?</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 3rem)", color: DARK, fontWeight: 700, marginBottom: "1.5rem", lineHeight: 1.2 }}>
            Visit Our Showroom Today
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", color: "rgba(10,10,10,0.65)", marginBottom: "2.5rem", fontSize: "1.05rem", lineHeight: 1.7 }}>
            Ground Floor, Sr. No. 24/2/2A/1, Near Shivaji Maharaj Museum, Wadgaon Shinde Road, Lohgaon, Pune
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <MagneticButton
              href="tel:+918390599247"
              style={{
                background: DARK,
                color: "var(--white)",
                padding: "16px 44px",
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                borderRadius: "var(--radius-sm)",
                letterSpacing: "0.05em",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "none",
                cursor: "pointer",
                boxShadow: "var(--shadow-md)"
              }}
            >
              <span>📞</span> +91 8390599247
            </MagneticButton>
            <MagneticButton
              href={`https://maps.google.com/?q=Roshan+Tiles+And+Granites+Lohgaon+Pune`}
              style={{
                background: "transparent",
                border: "2px solid rgba(10,10,10,0.3)",
                color: DARK,
                padding: "16px 44px",
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                transition: "all var(--transition-base)"
              }}
            >
              <span>📍</span> Get Directions
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION SECTION
// ═══════════════════════════════════════════════════════════════════════════
function Location() {
  return (
    <section id="location" style={{ padding: "120px 5%", background: DARK, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <SectionLabel>Find Us</SectionLabel>
          <SectionTitle light>Our Location</SectionTitle>
          <GoldDivider />
        </FadeIn>
        <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", boxShadow: "var(--shadow-lg)" }}>
          <iframe
            title="Roshan Tiles Location"
            width="100%"
            height="420"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            allowFullScreen
            src="https://maps.google.com/maps?q=Ground%20Floor%2C%20Sr.%20No.%2024%2F2%2F2A%2F1%2C%20Near%20Shivaji%20Maharaj%20Museum%2C%20Wadgaon%20Shinde%20Road%2C%20Lohgaon%2C%20Pune%20411047&z=16&output=embed"
          />
        </div>
        <div style={{ marginTop: "2.5rem", display: "flex", gap: "3rem", flexWrap: "wrap" }}>
          {[
            { icon: "📍", label: "Address", val: "Ground Floor, Sr. No. 24/2/2A/1, Near Shivaji Maharaj Museum, Wadgaon Shinde Road, Lohgaon, Pune - 411047" },
            { icon: "📞", label: "Phone", val: "+91 8390599247" },
            { icon: "🕐", label: "Hours", val: "Mon–Sat: 9 AM–8 PM | Sun: 10 AM–5 PM" }
          ].map((item) => (
            <FadeIn key={item.label}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: "1 1 200px" }}>
                <span style={{ fontSize: "1.4rem", marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>{item.label}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.92rem", color: "var(--white-70)", lineHeight: 1.7 }}>{item.val}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT SECTION
// ═══════════════════════════════════════════════════════════════════════════
function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", product: "", message: "" });
  const [sent, setSent] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const products = ["Floor Tiles", "Wall Tiles", "Vitrified Tiles", "Ceramic Tiles", "Granite Slabs", "Marble", "Natural Stone", "Designer Tiles", "Other"];

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const msg = `Hello Roshan Tiles!%0A%0A*Name:* ${form.name}%0A*Phone:* ${form.phone}%0A*Product:* ${form.product}%0A*Message:* ${form.message}`;
    window.open(`https://wa.me/918390599247?text=${msg}`, "_blank");
    setSent(true);
  };

  const inputStyle = (name) => ({
    width: "100%",
    padding: "16px 18px",
    fontFamily: "var(--font-sans)",
    fontSize: "0.92rem",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${focusedField === name ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`,
    borderRadius: "var(--radius-sm)",
    color: "var(--white)",
    outline: "none",
    boxSizing: "border-box",
    transition: "all var(--transition-fast)",
    boxShadow: focusedField === name ? "0 0 0 3px rgba(201,168,76,0.1)" : "none"
  });

  const optionStyle = { background: CHARCOAL, color: "var(--white)" };

  return (
    <section id="contact" style={{ padding: "120px 5%", background: CHARCOAL, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.04) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <SectionLabel>Get In Touch</SectionLabel>
          <SectionTitle light>Request a Consultation</SectionTitle>
          <p style={{ textAlign: "center", fontFamily: "var(--font-sans)", color: "var(--white-50)", marginBottom: "1rem", fontSize: "1.05rem" }}>Fill in your details and we will reach out within a few hours</p>
          <GoldDivider />
        </FadeIn>

        {sent ? (
          <FadeIn>
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "var(--radius-md)",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1.25rem" }}>✅</div>
              <h3 style={{ fontFamily: "var(--font-serif)", color: GOLD, fontSize: "1.6rem", marginBottom: "0.5rem" }}>Thank You!</h3>
              <p style={{ fontFamily: "var(--font-sans)", color: "var(--white-50)", marginBottom: 8 }}>We have received your enquiry and will contact you shortly.</p>
              <p style={{ fontFamily: "var(--font-sans)", color: "var(--white-30)", marginTop: 8 }}>Or call us directly: <a href="tel:+918390599247" style={{ color: GOLD, textDecoration: "none" }}>+91 8390599247</a></p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="form-grid">
                <div>
                  <label style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>Your Name *</label>
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={handle}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Rajesh Kumar"
                    style={inputStyle("name")}
                    aria-required="true"
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>Phone Number *</label>
                  <input
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handle}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="+91 98765 43210"
                    style={inputStyle("phone")}
                    aria-required="true"
                  />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>Product Requirement</label>
                <select
                  name="product"
                  value={form.product}
                  onChange={handle}
                  onFocus={() => setFocusedField("product")}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle("product"), appearance: "none", color: form.product ? "var(--white)" : "var(--white-50)" }}
                >
                  <option value="" style={{ background: CHARCOAL, color: "var(--white-50)" }}>Select a product category</option>
                  {products.map((p) => <option key={p} value={p} style={optionStyle}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handle}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  rows={4}
                  placeholder="Tell us about your project..."
                  style={{ ...inputStyle("message"), resize: "vertical", minHeight: 120 }}
                />
              </div>
              <MagneticButton
                type="submit"
                style={{
                  background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                  color: DARK,
                  padding: "18px 44px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
                  width: "100%"
                }}
              >
                Send Enquiry →
              </MagneticButton>
            </form>
          </FadeIn>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer style={{ background: DARK, borderTop: "1px solid rgba(201,168,76,0.15)", padding: "80px 5% 40px", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.03) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "4rem", marginBottom: "3rem" }} className="footer-grid">
          <div>
            <div style={{ fontFamily: "var(--font-serif)", marginBottom: "1.25rem" }}>
              <span style={{ color: GOLD, fontSize: "1.9rem", fontWeight: 700, display: "block", letterSpacing: "0.02em" }}>Roshan Tiles</span>
              <span style={{ color: "var(--white-30)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>& Granites</span>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", color: "var(--white-40)", lineHeight: 1.8, marginBottom: "1.25rem" }}>
              Premium Tiles • Granite • Marble • Stone Solutions<br />
              Serving Pune and surrounding areas with the finest natural stone and tile products.
            </p>
            <a href="tel:+918390599247" style={{ color: GOLD, fontFamily: "var(--font-serif)", fontSize: "1.25rem", textDecoration: "none", fontWeight: 600 }}>+91 8390599247</a>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "1.25rem", fontWeight: 600 }}>Products</p>
            {["Floor Tiles", "Wall Tiles", "Vitrified Tiles", "Granite Slabs", "Marble", "Natural Stone", "Designer Tiles"].map((p) => (
              <p key={p} style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--white-40)", marginBottom: 8, cursor: "pointer", transition: "color var(--transition-fast)" }}
                onMouseEnter={(e) => e.target.style.color = "var(--gold-light)"}
                onMouseLeave={(e) => e.target.style.color = "var(--white-40)"}
              >{p}</p>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: "1.25rem", fontWeight: 600 }}>Visit Us</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--white-40)", lineHeight: 1.8, marginBottom: "1.25rem" }}>
              Ground Floor, Sr. No. 24/2/2A/1,<br />
              Near Shivaji Maharaj Museum,<br />
              Wadgaon Shinde Road, Lohgaon,<br />
              Pune, Maharashtra 411047
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: GOLD, marginBottom: 6, fontWeight: 500 }}>Mon–Sat: 9 AM – 8 PM</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: GOLD, fontWeight: 500 }}>Sunday: 10 AM – 5 PM</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--white-25)" }}>
            © {new Date().getFullYear()} Roshan Tiles And Granites. All rights reserved.
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--white-15)" }}>Lohgaon, Pune 411047</p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING CALL BUTTON
// ═══════════════════════════════════════════════════════════════════════════
function FloatingCall() {
  return (
    <a
      href="tel:+918390599247"
      aria-label="Call Roshan Tiles"
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 200,
        background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
        color: DARK,
        width: 64,
        height: 64,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.6rem",
        textDecoration: "none",
        boxShadow: "0 4px 24px rgba(201,168,76,0.4)",
        animation: "pulse 2s infinite",
        transition: "transform var(--transition-fast)"
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      📞
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

        ${CSS_VARS}

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); font-family: var(--font-sans); }
        img { display: block; }
        section { scroll-margin-top: 80px; }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--dark); }
        ::-webkit-scrollbar-thumb { background: var(--charcoal-light); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--gold-dark); }

        /* Selection */
        ::selection { background: rgba(201, 168, 76, 0.3); color: var(--white); }

        /* Focus styles */
        :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

        /* Animations */
        @keyframes navSlideIn {
          from { opacity: 0; transform: translateY(-18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }

        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }

        @keyframes testimonialsMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.75rem)); }
        }

        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.2; }
          100% { transform: translateY(0) translateX(0); opacity: 0.1; }
        }

        @keyframes scrollPulse {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(250%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(201, 168, 76, 0.4); }
          50% { box-shadow: 0 4px 40px rgba(201, 168, 76, 0.7); }
        }

        /* Hover effects */
        .hover-lift {
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
        }

        .gold-glow-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .gold-glow-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(201, 168, 76, 0.35);
        }

        .gold-glow-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transition: left 0.55s ease;
        }

        .gold-glow-btn:hover::after {
          left: 130%;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .hero-mosaic { display: none !important; }
          .about-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .nav-logo { transform: none !important; }
        }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid > div { border-right: none !important; border-bottom: "1px solid rgba(10,10,10,0.1)"; }
          .gallery-grid { grid-template-columns: 1fr !important; }
          .gallery-grid > div { grid-column: span 1 !important; }
          .form-grid { grid-template-columns: 1fr !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      <Navbar />
      <Hero />
      <StatsBar />
      <About />
      <Products />
      <WhyUs />
      <Gallery />
      <Testimonials />
      <CTABand />
      <Location />
      <Contact />
      <Footer />
      <FloatingCall />
    </>
  );
}
