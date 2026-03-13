import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Activity, ShieldCheck, GitCompare, FileText, Info, Clock } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import DeIdentify from './pages/DeIdentify'
import Contradictions from './pages/Contradictions'
import Reports from './pages/Reports'
import About from './pages/About'
import Timeline from './pages/Timeline'

function Navbar() {
  const links = [
    { to: '/', icon: <Activity size={14} />, label: 'Dashboard' },
    { to: '/deidentify', icon: <ShieldCheck size={14} />, label: 'De-Identification' },
    { to: '/contradictions', icon: <GitCompare size={14} />, label: 'Contradictions' },
    { to: '/timeline', icon: <Clock size={14} />, label: 'Timeline' },
    { to: '/reports', icon: <FileText size={14} />, label: 'Reports' },
    { to: '/about', icon: <Info size={14} />, label: 'About' },
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
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #2563eb, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(59,130,246,0.4)'
          }}>
            <ShieldCheck size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
              <span className="gradient-text">MedGuard</span>
              <span style={{ color: '#8ba3c7', fontWeight: 400 }}> AI</span>
            </div>
            <div style={{ fontSize: 9, color: '#4a6285', letterSpacing: '0.12em' }}>CLINICAL INTELLIGENCE</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', overflowX: 'auto' }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {l.icon}{l.label}
            </NavLink>
          ))}
        </div>

        {/* Status */}
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 999, padding: '4px 10px', fontSize: 11, color: '#34d399',
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
          Live
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
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
