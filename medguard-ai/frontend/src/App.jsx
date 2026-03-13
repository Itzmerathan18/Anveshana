import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Activity, ShieldCheck, GitCompare, FileText, Info, Clock, Sun, Moon } from 'lucide-react'
import { useLang } from './contexts/LanguageContext.jsx'
import { useTheme } from './contexts/ThemeContext.jsx'
import Dashboard from './pages/Dashboard'
import DeIdentify from './pages/DeIdentify'
import Contradictions from './pages/Contradictions'
import Reports from './pages/Reports'
import About from './pages/About'
import Timeline from './pages/Timeline'

function Navbar() {
  const { t, lang, setLang } = useLang()
  const { isDark, toggle } = useTheme()

  const links = [
    { to: '/', icon: <Activity size={13} />, label: t.nav.dashboard },
    { to: '/deidentify', icon: <ShieldCheck size={13} />, label: t.nav.deidentify },
    { to: '/contradictions', icon: <GitCompare size={13} />, label: t.nav.contradictions },
    { to: '/timeline', icon: <Clock size={13} />, label: t.nav.timeline },
    { to: '/reports', icon: <FileText size={13} />, label: t.nav.reports },
    { to: '/about', icon: <Info size={13} />, label: t.nav.about },
  ]

  return (
    <nav style={{
      background: 'var(--bg-nav)',
      borderBottom: '1px solid var(--border-card)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 20px',
    }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, gap: 12 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(59,130,246,0.4)'
          }}>
            <ShieldCheck size={17} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
              <span className="gradient-text">{t.appName}</span>
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.tagline}</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1, justifyContent: 'center', overflowX: 'auto' }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {l.icon}{l.label}
            </NavLink>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Language switcher */}
          <div className="lang-pill">
            {[['en','EN'],['hi','हि'],['kn','ಕ']].map(([code, label]) => (
              <button key={code} className={lang === code ? 'active' : ''} onClick={() => setLang(code)} title={code === 'en' ? 'English' : code === 'hi' ? 'Hindi' : 'Kannada'}>
                {label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button onClick={toggle} className="btn-icon" title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Status */}
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 999, padding: '4px 10px', fontSize: 10, color: '#34d399',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
            Live
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="glow-accent-right" />
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 58px)' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deidentify" element={<DeIdentify />} />
          <Route path="/contradictions" element={<Contradictions />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
