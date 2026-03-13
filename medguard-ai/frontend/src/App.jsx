import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Activity, ShieldCheck, GitCompare, FileText, Info, X, Menu } from 'lucide-react'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import DeIdentify from './pages/DeIdentify'
import Contradictions from './pages/Contradictions'
import Reports from './pages/Reports'
import About from './pages/About'

function Navbar() {
  const [open, setOpen] = useState(false)
  const links = [
    { to: '/', icon: <Activity size={15} />, label: 'Dashboard' },
    { to: '/deidentify', icon: <ShieldCheck size={15} />, label: 'De-Identification' },
    { to: '/contradictions', icon: <GitCompare size={15} />, label: 'Contradiction Engine' },
    { to: '/reports', icon: <FileText size={15} />, label: 'Reports' },
    { to: '/about', icon: <Info size={15} />, label: 'About' },
  ]

  return (
    <nav style={{
      background: 'rgba(5,11,24,0.96)',
      borderBottom: '1px solid rgba(59,130,246,0.12)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 24px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59,130,246,0.4)'
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
              <span className="gradient-text">MedGuard</span>
              <span style={{ color: '#8ba3c7', fontWeight: 400 }}> AI</span>
            </div>
            <div style={{ fontSize: 10, color: '#4a6285', letterSpacing: '0.12em', marginTop: -2 }}>CLINICAL INTELLIGENCE</div>
          </div>
        </div>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="desktop-nav">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {l.icon}{l.label}
            </NavLink>
          ))}
        </div>

        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 999, padding: '4px 12px', fontSize: 12, color: '#34d399',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
            System Online
          </div>
          {/* Mobile menu button */}
          <button onClick={() => setOpen(o => !o)} style={{
            background: 'none', border: 'none', color: '#8ba3c7', cursor: 'pointer', display: 'none'
          }} className="mobile-menu-btn">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div style={{ padding: '8px 0 16px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{ display: 'flex', padding: '10px 16px' }}>
              {l.icon}{l.label}
            </NavLink>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deidentify" element={<DeIdentify />} />
          <Route path="/contradictions" element={<Contradictions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
