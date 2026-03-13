import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FileText, Shield, AlertTriangle, Users, TrendingUp, Clock, Activity, Zap } from 'lucide-react'

const COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

// ─── Risk Gauge (Speedometer) ────────────────────────────────────────────────
function RiskGauge({ score, label }) {
  const pct = Math.min(score, 100)
  const color = pct >= 70 ? '#ef4444' : pct >= 45 ? '#f97316' : pct >= 20 ? '#eab308' : '#22c55e'
  const riskLabel = pct >= 70 ? 'CRITICAL' : pct >= 45 ? 'HIGH' : pct >= 20 ? 'MEDIUM' : 'LOW'

  // Build SVG arc
  const radius = 70
  const cx = 90, cy = 90
  const startAngle = 220 // degrees, clockwise from right = 0
  const sweepMax = 280 // total sweep degrees
  const sweep = (pct / 100) * sweepMax

  const toRad = (deg) => (deg - 90) * (Math.PI / 180)
  const arc = (cx, cy, r, startDeg, endDeg) => {
    const s = toRad(startDeg), e = toRad(endDeg)
    const large = (endDeg - startDeg) > 180 ? 1 : 0
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`
  }

  const bgStart = startAngle
  const bgEnd = startAngle + sweepMax
  const fgEnd = startAngle + sweep

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={180} height={130} viewBox="0 0 180 130">
        {/* Track */}
        <path d={arc(cx, cy, radius, bgStart, bgEnd)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={14} strokeLinecap="round" />
        {/* Fill */}
        {pct > 0 && (
          <path d={arc(cx, cy, radius, bgStart, fgEnd)} fill="none"
            stroke={color} strokeWidth={14} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
        )}
        {/* Score text */}
        <text x={cx} y={cy + 10} textAnchor="middle" fill="white" fontSize="26" fontWeight="800" fontFamily="Space Grotesk">{score}</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fill="#8ba3c7" fontSize="10">/100</text>
      </svg>
      <div style={{ marginTop: -8 }}>
        <span className={`badge badge-${riskLabel.toLowerCase()}`} style={{ fontSize: 12, padding: '5px 14px' }}>{riskLabel} RISK</span>
        {label && <div style={{ fontSize: 11, color: '#4a6285', marginTop: 6 }}>{label}</div>}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, sublabel, trend }) {
  const colorMap = { blue: '59,130,246', emerald: '16,185,129', critical: '239,68,68', high: '249,115,22' }
  const rgb = colorMap[color] || '59,130,246'
  return (
    <div className={`glass-card stat-card-${color}`} style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#8ba3c7', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4, fontFamily: 'Space Grotesk' }}>{value?.toLocaleString()}</div>
          {sublabel && <div style={{ fontSize: 11, color: '#4a6285', marginTop: 3 }}>{sublabel}</div>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: `rgba(${rgb},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <TrendingUp size={12} color="#34d399" />
          <span style={{ fontSize: 11, color: '#34d399' }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

function ContraCard({ item }) {
  const sev = item.severity?.toLowerCase()
  return (
    <div className="glass-card" style={{ padding: 14, marginBottom: 10, borderColor: sev === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`badge badge-${sev}`}>{item.severity}</span>
          <span className="badge badge-blue">{item.type?.replace(/_/g,' ')}</span>
        </div>
        <span style={{ fontSize: 11, color: '#4a6285' }}>{Math.round((item.confidence||0)*100)}% conf.</span>
      </div>
      <div style={{ fontSize: 12, color: '#8ba3c7', lineHeight: 1.5 }}>{item.description}</div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/dashboard/').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <div style={{ color: '#8ba3c7' }}>Loading dashboard…</div>
    </div>
  )

  if (!data) return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#f87171' }}>
        Could not connect to backend. Ensure FastAPI is running on port 8000.
      </div>
    </div>
  )

  const { stats, phi_distribution, contradiction_severity, monthly_trend, recent_contradictions, high_risk_patients } = data

  // Confidence chart data from recent contradictions
  const confidenceData = recent_contradictions?.map(c => ({
    name: c.type?.replace(/_/g,' ').substring(0,16),
    confidence: Math.round((c.confidence||0)*100),
    fill: COLORS[c.severity] || '#6b7280'
  })) || []

  // Overall risk score from demo patients
  const avgRiskScore = high_risk_patients?.length
    ? Math.round(high_risk_patients.reduce((a, p) => a + p.risk_score, 0) / high_risk_patients.length)
    : 0

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: '#4a6285', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 4 }}>AI CLINICAL SAFETY ENGINE</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
          <span className="gradient-text">Patient Safety</span> Dashboard
        </h1>
        <p style={{ color: '#8ba3c7', marginTop: 4, fontSize: 13 }}>
          PHI detection · Contradiction monitoring · Clinical risk intelligence
        </p>
        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.22)', borderRadius: 7, padding: '3px 10px', fontSize: 11, color: '#facc15' }}>
          ⚠️ Demo — Synthea synthetic dataset. No real patient data.
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 22 }}>
        <StatCard label="Documents Processed" value={stats.documents_processed} icon={<FileText size={20} color="#60a5fa" />} color="blue" trend="+12 this week" />
        <StatCard label="PHI Detected" value={stats.phi_items_detected} icon={<Shield size={20} color="#f87171" />} color="critical" sublabel="All redacted" />
        <StatCard label="Contradictions" value={stats.contradictions_found} icon={<AlertTriangle size={20} color="#fb923c" />} color="high" />
        <StatCard label="Patients Analyzed" value={stats.patients_analyzed} icon={<Users size={20} color="#34d399" />} color="emerald" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 16, marginBottom: 18 }}>
        {/* Monthly trend */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Monthly Trend</div>
          <div style={{ fontSize: 11, color: '#8ba3c7', marginBottom: 14 }}>Documents & contradictions over time</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthly_trend}>
              <defs>
                <linearGradient id="gDoc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gContra" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#8ba3c7', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8ba3c7', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff', fontSize: 12 }} />
              <Area type="monotone" dataKey="documents" stroke="#3b82f6" fill="url(#gDoc)" strokeWidth={2} name="Documents" />
              <Area type="monotone" dataKey="contradictions" stroke="#f97316" fill="url(#gContra)" strokeWidth={2} name="Contradictions" />
              <Legend wrapperStyle={{ color: '#8ba3c7', fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence chart */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Contradiction Confidence Scores</div>
          <div style={{ fontSize: 11, color: '#8ba3c7', marginBottom: 14 }}>AI confidence per detected contradiction</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#8ba3c7', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill: '#8ba3c7', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff', fontSize: 12 }} />
              <Bar dataKey="confidence" radius={[4,4,0,0]} name="Confidence">
                {confidenceData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk gauge */}
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, textAlign: 'center' }}>Avg. Patient Risk</div>
          <div style={{ fontSize: 11, color: '#8ba3c7', marginBottom: 16, textAlign: 'center' }}>Across {high_risk_patients?.length} analyzed patients</div>
          <RiskGauge score={avgRiskScore} label="Average composite risk score" />
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        {/* PHI distribution */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>PHI Type Distribution</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={phi_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="type" tick={{ fill: '#8ba3c7', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8ba3c7', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff', fontSize: 12 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity pie */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Contradiction Severity</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={contradiction_severity} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="count" nameKey="severity" paddingAngle={3}>
                {contradiction_severity.map((e, i) => <Cell key={i} fill={COLORS[e.severity] || '#6b7280'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff', fontSize: 12 }} />
              <Legend wrapperStyle={{ color: '#8ba3c7', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent contradictions */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={14} color="#f97316" /> Recent Contradictions
          </div>
          {recent_contradictions?.map((c, i) => <ContraCard key={i} item={c} />)}
        </div>

        {/* High risk patients */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Activity size={14} color="#60a5fa" /> High Risk Patients
          </div>
          {high_risk_patients?.map((p, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < high_risk_patients.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{p.id}</div>
                  <div style={{ fontSize: 11, color: '#4a6285', marginTop: 2 }}>
                    {p.documents?.length} docs · {p.contradiction_count} contradiction{p.contradiction_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`badge badge-${p.risk_level?.toLowerCase()}`}>{p.risk_level}</span>
                  <div style={{ fontSize: 11, color: '#8ba3c7' }}>{p.risk_score}/100</div>
                </div>
              </div>
              <div className="risk-bar" style={{ marginTop: 6 }}>
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
