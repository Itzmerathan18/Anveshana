import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, Download, Shield, AlertTriangle, CheckCircle, TrendingUp, Calendar } from 'lucide-react'

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/dashboard/')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const generateReport = () => {
    if (!data) return
    const { stats, phi_distribution, contradiction_severity } = data
    const reportText = `
MEDGUARD AI — CLINICAL INTELLIGENCE REPORT
Generated: ${new Date().toLocaleString()}
Dataset: Synthea Synthetic Patient Records
============================================

EXECUTIVE SUMMARY
-----------------
Documents Processed:       ${stats.documents_processed}
PHI Items Detected:        ${stats.phi_items_detected}
Contradictions Found:      ${stats.contradictions_found}
Patients Analyzed:         ${stats.patients_analyzed}
Risk Alerts Issued:        ${stats.risk_alerts}

PHI TYPE DISTRIBUTION
---------------------
${phi_distribution.map(p => `  ${p.type.padEnd(20)} ${p.count} occurrences  [${p.severity}]`).join('\n')}

CONTRADICTION SEVERITY BREAKDOWN
---------------------------------
${contradiction_severity.map(c => `  ${c.severity.padEnd(10)} ${c.count} contradictions`).join('\n')}

COMPLIANCE STATEMENT
--------------------
All analysis performed on Synthea-generated synthetic patient data.
No real Protected Health Information (PHI) was used.
System aligns with HIPAA Safe Harbor de-identification principles.

MedGuard AI — Cognitva Healthcare AI Challenge
    `.trim()

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'MedGuard_Report.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16, flexDirection: 'column' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <div style={{ color: '#8ba3c7' }}>Loading reports…</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: '#4a6285', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>AUDIT & ANALYTICS</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Analysis</span> Reports
          </h1>
          <p style={{ color: '#8ba3c7', marginTop: 6, fontSize: 14 }}>Summary of all PHI detections, contradictions, and patient safety metrics</p>
        </div>
        <button onClick={generateReport} className="btn-primary">
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
        {data && [
          { label: 'Total Documents', value: data.stats.documents_processed, icon: <FileText size={20} color="#60a5fa" />, color: '#60a5fa' },
          { label: 'PHI Instances Removed', value: data.stats.phi_items_detected, icon: <Shield size={20} color="#f87171" />, color: '#f87171' },
          { label: 'Contradictions Flagged', value: data.stats.contradictions_found, icon: <AlertTriangle size={20} color="#fb923c" />, color: '#fb923c' },
          { label: 'Risk Alerts', value: data.stats.risk_alerts, icon: <TrendingUp size={20} color="#facc15" />, color: '#facc15' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>{s.icon}<span style={{ fontSize: 12, color: '#8ba3c7' }}>{s.label}</span></div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value?.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* PHI breakdown */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Shield size={16} color="#60a5fa" /> PHI Detection Breakdown
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['PHI Type', 'Occurrences', 'Severity', 'HIPAA Category'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#4a6285', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.phi_distribution.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.type}</td>
                  <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: 700 }}>{p.count}</td>
                  <td style={{ padding: '10px 14px' }}><span className={`badge badge-${p.severity?.toLowerCase()}`}>{p.severity}</span></td>
                  <td style={{ padding: '10px 14px', color: '#8ba3c7', fontSize: 12 }}>HIPAA Safe Harbor §164.514</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contradiction breakdown */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={16} color="#f97316" /> Contradiction Severity Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14 }}>
          {data?.contradiction_severity.map((c, i) => (
            <div key={i} className="glass-card" style={{ padding: 18, textAlign: 'center', borderColor: `rgba(${c.severity === 'CRITICAL' ? '239,68,68' : c.severity === 'HIGH' ? '249,115,22' : c.severity === 'MEDIUM' ? '234,179,8' : '34,197,94'}, 0.3)` }}>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{c.count}</div>
              <span className={`badge badge-${c.severity?.toLowerCase()}`} style={{ marginTop: 8 }}>{c.severity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance note */}
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#34d399', marginBottom: 4 }}>Compliance Certification</div>
            <div style={{ fontSize: 13, color: '#8ba3c7', lineHeight: 1.7 }}>
              All above statistics are generated from <strong style={{ color: '#f0f6ff' }}>Synthea synthetic patient data</strong>. 
              MedGuard AI does not store, retain, or process any real Protected Health Information. 
              De-identification follows HIPAA Safe Harbor methodology (45 CFR §164.514(b)). 
              This report is intended for research and demonstration purposes only.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
