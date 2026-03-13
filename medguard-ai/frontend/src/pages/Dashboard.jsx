import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  FileText, Shield, AlertTriangle, Activity,
  TrendingUp, Users, ChevronRight, Clock
} from 'lucide-react'

const RADIAN = Math.PI / 180

const COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
}

function StatCard({ label, value, icon, color, sublabel, trend }) {
  return (
    <div className={`glass-card stat-card-${color}`} style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#8ba3c7', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, fontFamily: 'Space Grotesk' }}>{value?.toLocaleString()}</div>
          {sublabel && <div style={{ fontSize: 12, color: '#4a6285', marginTop: 4 }}>{sublabel}</div>}
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `rgba(${color === 'blue' ? '59,130,246' : color === 'emerald' ? '16,185,129' : color === 'critical' ? '239,68,68' : '249,115,22'}, 0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={13} color="#34d399" />
          <span style={{ fontSize: 12, color: '#34d399' }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

function ContraCard({ item }) {
  const sev = item.severity?.toLowerCase()
  return (
    <div className="glass-card" style={{ padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`badge badge-${sev}`}>{item.severity}</span>
          <span className="badge badge-blue">{item.type?.replace(/_/g, ' ')}</span>
        </div>
        <div style={{ fontSize: 11, color: '#4a6285' }}>
          {Math.round((item.confidence || 0) * 100)}% confidence
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{item.description}</div>
      <div style={{ fontSize: 11, color: '#4a6285', marginTop: 8, display: 'flex', gap: 12 }}>
        {item.doc_a && <span>📄 {item.doc_a}</span>}
        {item.doc_b && <span>📄 {item.doc_b}</span>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/dashboard/')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <div style={{ color: '#8ba3c7' }}>Loading dashboard data…</div>
    </div>
  )

  if (!data) return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#f87171' }}>
        Could not connect to backend. Please ensure the FastAPI server is running on port 8000.
      </div>
    </div>
  )

  const { stats, phi_distribution, contradiction_severity, monthly_trend, recent_contradictions, high_risk_patients } = data

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#4a6285', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>CLINICAL INTELLIGENCE PLATFORM</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
          <span className="gradient-text">Patient Safety</span> Dashboard
        </h1>
        <p style={{ color: '#8ba3c7', marginTop: 6, fontSize: 14 }}>
          Real-time analysis of medical records — PHI detection & contradiction monitoring
        </p>
        <div style={{
          marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)',
          borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#facc15'
        }}>
          ⚠️ Demo mode — Synthetic Synthea dataset. No real patient data.
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Documents Processed" value={stats.documents_processed} icon={<FileText size={22} color="#60a5fa" />} color="blue" trend="+12 this week" />
        <StatCard label="PHI Items Detected" value={stats.phi_items_detected} icon={<Shield size={22} color="#f87171" />} color="critical" sublabel="All redacted" />
        <StatCard label="Contradictions Found" value={stats.contradictions_found} icon={<AlertTriangle size={22} color="#fb923c" />} color="high" trend="Requires review" />
        <StatCard label="Patients Analyzed" value={stats.patients_analyzed} icon={<Users size={22} color="#34d399" />} color="emerald" sublabel="Unique records" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Monthly trend */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Monthly Processing Trend</div>
            <div style={{ fontSize: 12, color: '#8ba3c7' }}>Documents & contradictions over time</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly_trend}>
              <defs>
                <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="contraGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#8ba3c7', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8ba3c7', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff' }} />
              <Area type="monotone" dataKey="documents" stroke="#3b82f6" fill="url(#docGrad)" strokeWidth={2} name="Documents" />
              <Area type="monotone" dataKey="contradictions" stroke="#f97316" fill="url(#contraGrad)" strokeWidth={2} name="Contradictions" />
              <Legend wrapperStyle={{ color: '#8ba3c7', fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Contradiction severity pie */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Contradiction Severity</div>
            <div style={{ fontSize: 12, color: '#8ba3c7' }}>Distribution by risk level</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={contradiction_severity} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="count" nameKey="severity" paddingAngle={3}>
                {contradiction_severity.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.severity] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff' }} />
              <Legend wrapperStyle={{ color: '#8ba3c7', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PHI distribution bar */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>PHI Type Distribution</div>
          <div style={{ fontSize: 12, color: '#8ba3c7' }}>Count of detected PHI instances by type</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={phi_distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="type" tick={{ fill: '#8ba3c7', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8ba3c7', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff' }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent contradictions */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Recent Contradictions</div>
          {recent_contradictions?.map((c, i) => <ContraCard key={i} item={c} />)}
        </div>

        {/* High risk patients */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>High Risk Patients</div>
          {high_risk_patients?.map((p, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < high_risk_patients.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{p.id}</div>
                  <div style={{ fontSize: 11, color: '#4a6285', marginTop: 2 }}>
                    {p.documents?.length} documents · {p.contradiction_count} contradiction{p.contradiction_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`badge badge-${p.risk_level?.toLowerCase()}`}>{p.risk_level}</span>
                  <div style={{ fontSize: 11, color: '#8ba3c7' }}>Score: {p.risk_score}/100</div>
                </div>
              </div>
              {/* Risk bar */}
              <div className="risk-bar" style={{ marginTop: 8 }}>
                <div className="risk-fill" style={{
                  width: `${p.risk_score}%`,
                  background: p.risk_score >= 70 ? '#ef4444' : p.risk_score >= 45 ? '#f97316' : '#eab308'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
