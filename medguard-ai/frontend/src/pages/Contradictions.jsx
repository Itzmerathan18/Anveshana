import { useState, useCallback } from 'react'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload, AlertTriangle, CheckCircle, GitCompare, ChevronDown, ChevronUp, Zap, FileX } from 'lucide-react'

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const SAMPLE_DOC_1 = `PATIENT RECORD — ALLERGY & HISTORY
Patient ID: PT-Demo-01
Date: 2023-05-10

ALLERGIES:
Allergy to Penicillin (anaphylaxis reaction documented)
No Known Drug Allergy to sulfonamides

DIAGNOSES:
1. Type 2 Diabetes (confirmed 2021)
2. Hypertension
3. Chronic Kidney Disease Stage 3

CURRENT MEDICATIONS:
- Metformin 1000mg twice daily
- Lisinopril 10mg once daily

Lab Results (2024-01-10):
Blood Glucose: 285 mg/dL (CRITICAL HIGH)
Hemoglobin: 9.2 g/dL (ABNORMAL)
Creatinine: 2.8 mg/dL`

const SAMPLE_DOC_2 = `OUTPATIENT PRESCRIPTION — 2024-02-15
Patient: PT-Demo-01

Prescribed medications:
1. Amoxicillin 500mg three times daily (for respiratory infection)
2. Ibuprofen 400mg as needed for pain
3. Metformin 500mg twice daily

Clinical Notes:
Patient denies diabetes. No known allergies reported by patient today.
No history of kidney disease.
Blood Pressure: 145/92 mmHg
Heart Rate: 88 bpm`

function ContraCard({ c, index }) {
  const [open, setOpen] = useState(false)
  const sev = c.severity?.toLowerCase()

  return (
    <div className="glass-card animate-slide-in" style={{
      padding: 20, marginBottom: 12,
      animationDelay: `${index * 0.07}s`,
      borderColor: `rgba(${sev === 'critical' ? '239,68,68' : sev === 'high' ? '249,115,22' : sev === 'medium' ? '234,179,8' : '34,197,94'}, 0.25)`
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Severity icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `rgba(${sev === 'critical' ? '239,68,68' : sev === 'high' ? '249,115,22' : '234,179,8'}, 0.12)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <AlertTriangle size={18} color={sev === 'critical' ? '#f87171' : sev === 'high' ? '#fb923c' : '#facc15'} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
            <span className={`badge badge-${sev}`}>{c.severity}</span>
            <span className="badge badge-blue">{c.type?.replace(/_/g, ' ')}</span>
            {c.cross_document && <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>CROSS-DOC</span>}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4a6285' }}>
              {Math.round((c.confidence || 0) * 100)}% confidence
            </span>
          </div>

          <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 }}>{c.description}</div>

          {/* Source docs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            {c.doc_a && <div style={{ fontSize: 11, color: '#4a6285', display: 'flex', gap: 4, alignItems: 'center' }}>
              📄 {c.source_doc || c.doc_a}
            </div>}
            {c.doc_b && <div style={{ fontSize: 11, color: '#4a6285', display: 'flex', gap: 4, alignItems: 'center' }}>
              📄 {c.doc_b}
            </div>}
          </div>

          {/* Reasoning trace toggle */}
          {c.reasoning_trace?.length > 0 && (
            <div>
              <button onClick={() => setOpen(o => !o)} className="btn-secondary"
                style={{ fontSize: 11, padding: '4px 10px', gap: 4 }}>
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {open ? 'Hide' : 'Show'} Reasoning Trace
              </button>
              {open && (
                <div className="glass-card animate-fade-in" style={{ padding: 14, marginTop: 10, borderColor: 'rgba(59,130,246,0.12)' }}>
                  <div style={{ fontSize: 11, color: '#4a6285', fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em' }}>EXPLAINABLE AI REASONING</div>
                  {c.reasoning_trace.map((step, i) => (
                    <div key={i} className="trace-step">
                      <div className="trace-number">{i + 1}</div>
                      <div style={{ flex: 1, lineHeight: 1.5 }}>{step.replace(/Step \d+:\s*/, '')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EntitySummary({ entities }) {
  if (!entities) return null
  const { diagnoses, medications, lab_values, allergies } = entities

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
      {[
        { label: 'Diagnoses', items: diagnoses, color: '#60a5fa', render: d => `${d.name}${d.negated ? ' (denied)' : ''}` },
        { label: 'Medications', items: medications, color: '#34d399', render: m => `${m.name}${m.dose ? ` ${m.dose}` : ''}` },
        { label: 'Lab Values', items: lab_values, color: '#facc15', render: l => `${l.test}: ${l.value} ${l.unit} (${l.status})` },
        { label: 'Allergies', items: allergies, color: '#f87171', render: a => a.allergen },
      ].map(({ label, items, color, render }) => (
        <div key={label} className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase' }}>{label}</div>
          {items?.length ? items.slice(0, 5).map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: '#8ba3c7', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {render(item)}
            </div>
          )) : <div style={{ fontSize: 12, color: '#4a6285' }}>None detected</div>}
        </div>
      ))}
    </div>
  )
}

export default function Contradictions() {
  const [mode, setMode] = useState('demo') // 'demo' | 'upload' | 'text'
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [text1, setText1] = useState(SAMPLE_DOC_1)
  const [text2, setText2] = useState(SAMPLE_DOC_2)

  const loadDemo = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await axios.get('/api/contradictions/demo')
      setResult({ ...res.data, demo: true })
    } catch { setError('Could not load demo data.') }
    finally { setLoading(false) }
  }

  const analyzeTexts = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const docs = [
        { text: text1, filename: 'Document_1.txt' },
        text2 && { text: text2, filename: 'Document_2.txt' }
      ].filter(Boolean)
      const res = await axios.post('/api/contradictions/text', { text: text1 })
      // Also analyze second doc combined
      if (text2) {
        const combined = await axios.post('/api/contradictions/text', { text: text1 + '\n\n---\n\n' + text2 })
        setResult({ ...combined.data, entities: combined.data.entities })
      } else {
        setResult(res.data)
      }
    } catch (e) { setError(e.response?.data?.detail || 'Analysis failed.') }
    finally { setLoading(false) }
  }

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    multiple: true, maxFiles: 5,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'image/*': ['.png', '.jpg'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
  })

  const analyzeFiles = async () => {
    if (!acceptedFiles.length) return
    setLoading(true); setError(null); setResult(null)
    const form = new FormData()
    acceptedFiles.forEach(f => form.append('files', f))
    try {
      const res = await axios.post('/api/contradictions/multi', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data)
    } catch (e) { setError(e.response?.data?.detail || 'Upload failed.') }
    finally { setLoading(false) }
  }

  const sortedContradictions = result?.contradictions
    ? [...result.contradictions].sort((a, b) => (SEVERITY_ORDER[a.severity] || 4) - (SEVERITY_ORDER[b.severity] || 4))
    : []

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#4a6285', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>HYBRID AI ENGINE — RULE + NLP</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
          <span className="gradient-text-red">Contradiction</span> Detection Engine
        </h1>
        <p style={{ color: '#8ba3c7', marginTop: 6, fontSize: 14 }}>
          Analyzes clinical documents for allergy-medication conflicts, diagnosis discrepancies, contraindications, and critical lab values.
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['demo', '⚡ Load Demo'], ['text', '✏️ Paste Text'], ['upload', '📄 Upload Files']].map(([key, label]) => (
          <button key={key} onClick={() => { setMode(key); setResult(null); setError(null) }}
            className={mode === key ? 'btn-primary' : 'btn-secondary'}>
            {label}
          </button>
        ))}
      </div>

      {/* Input modes */}
      {mode === 'demo' && (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <Zap size={40} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Synthetic Demo Case</div>
          <div style={{ color: '#8ba3c7', fontSize: 14, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
            Loads a pre-analyzed patient case with multiple contradictions including allergy-medication conflict, diagnosis discrepancy, and contraindication.
          </div>
          <button onClick={loadDemo} className="btn-primary" disabled={loading}>
            {loading ? <><div className="spinner" /> Loading…</> : <><Zap size={14} /> Run Demo Analysis</>}
          </button>
        </div>
      )}

      {mode === 'text' && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Document 1 (medical history, allergies)', value: text1, setter: setText1 },
              { label: 'Document 2 (prescriptions, notes)', value: text2, setter: setText2 }
            ].map(({ label, value, setter }, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, color: '#8ba3c7', marginBottom: 8 }}>{label}</div>
                <textarea value={value} onChange={e => setter(e.target.value)}
                  style={{
                    width: '100%', minHeight: 220, background: 'rgba(5,11,24,0.6)',
                    border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10,
                    color: '#f0f6ff', fontFamily: 'monospace', fontSize: 12, padding: 12,
                    resize: 'vertical', outline: 'none', lineHeight: 1.6
                  }} />
              </div>
            ))}
          </div>
          <button onClick={analyzeTexts} disabled={loading} className="btn-primary">
            {loading ? <><div className="spinner" /> Analyzing…</> : <><GitCompare size={14} /> Detect Contradictions</>}
          </button>
        </div>
      )}

      {mode === 'upload' && (
        <div style={{ marginBottom: 24 }}>
          <div className={`upload-zone${isDragActive ? ' active' : ''}`} {...getRootProps()} style={{ padding: 48, textAlign: 'center', marginBottom: 12 }}>
            <input {...getInputProps()} />
            <Upload size={36} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Upload patient documents (up to 5)</div>
            <div style={{ color: '#8ba3c7', fontSize: 13 }}>PDF, DOCX, TXT, PNG · Cross-document analysis</div>
          </div>
          {acceptedFiles.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {acceptedFiles.map(f => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#8ba3c7' }}>
                  <CheckCircle size={13} color="#10b981" /> {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </div>
              ))}
              <button onClick={analyzeFiles} disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
                {loading ? <><div className="spinner" /> Analyzing…</> : <><GitCompare size={14} /> Analyze {acceptedFiles.length} Document{acceptedFiles.length !== 1 ? 's' : ''}</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card" style={{ padding: 16, borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <div style={{ color: '#f87171', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
          <div style={{ color: '#8ba3c7' }}>Running contradiction analysis…</div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="animate-slide-in">
          {/* Summary bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: sortedContradictions.length > 0 ? '#f87171' : '#34d399' }}>
                {result.contradiction_count ?? sortedContradictions.length}
              </div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>Contradictions</div>
            </div>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{result.risk_score ?? '—'}</div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>Risk Score /100</div>
            </div>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <span className={`badge badge-${(result.risk_level || 'LOW').toLowerCase()}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                {result.risk_level || 'LOW'}
              </span>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 8 }}>Risk Level</div>
            </div>
            {result.cross_document_count != null && (
              <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#a78bfa' }}>{result.cross_document_count}</div>
                <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>Cross-Doc Issues</div>
              </div>
            )}
          </div>

          {/* Risk bar */}
          {result.risk_score != null && (
            <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Patient Risk Score</span>
                <span style={{ fontSize: 13, color: '#8ba3c7' }}>{result.risk_score}/100</span>
              </div>
              <div className="risk-bar" style={{ height: 10 }}>
                <div className="risk-fill" style={{
                  width: `${result.risk_score}%`,
                  background: result.risk_score >= 70 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : result.risk_score >= 45 ? 'linear-gradient(90deg,#f97316,#ea580c)' : 'linear-gradient(90deg,#eab308,#ca8a04)'
                }} />
              </div>
            </div>
          )}

          {/* Extracted entities */}
          {result.entities && <EntitySummary entities={result.entities} />}

          {/* Contradictions list */}
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#f97316" />
            Detected Contradictions ({sortedContradictions.length})
          </div>

          {sortedContradictions.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#34d399' }}>No contradictions detected</div>
              <div style={{ color: '#8ba3c7', marginTop: 6, fontSize: 13 }}>The analyzed documents appear consistent.</div>
            </div>
          ) : (
            sortedContradictions.map((c, i) => <ContraCard key={i} c={c} index={i} />)
          )}

          {result.demo && (
            <div style={{ marginTop: 16, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#facc15' }}>
              ⚠️ Demo data — Synthetic Synthea patient records. No real patient data used.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
