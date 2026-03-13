import { useState, useCallback } from 'react'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload, ShieldCheck, AlertCircle, CheckCircle, FileText, Eye, EyeOff, Download } from 'lucide-react'

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e'
}

const SAMPLE_TEXT = `Patient: Dr. Sarah Johnson
DOB: 03/15/1978  MRN: 4729183
Phone: (555) 234-7890  Email: sarah.j@email.com
SSN: 123-45-6789

CLINICAL NOTE — 01/12/2024
Patient presents with Type 2 Diabetes and Hypertension.
Allergy: Penicillin (anaphylaxis)
Current Medications: Metformin 500mg twice daily, Lisinopril 10mg once daily
Blood Glucose: 250 mg/dL  Blood Pressure: 158/96 mmHg
HbA1c: 8.2%  Hemoglobin: 13.1 g/dL

Prescribed: Amoxicillin 500mg for upper respiratory infection.
Physician NPI: 1234567890
Next appointment: 02/15/2024`

function RedactedPreview({ original, redacted, findings }) {
  const [showOriginal, setShowOriginal] = useState(false)

  const highlightRedacted = (text) => {
    if (!text) return text
    // Highlight [TYPE REDACTED] patterns
    return text.split(/(\[[^\]]+REDACTED[^\]]*\])/g).map((part, i) =>
      /REDACTED/.test(part)
        ? <span key={i} className="phi-highlight">{part}</span>
        : <span key={i}>{part}</span>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Original */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#f87171', display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertCircle size={14} /> Original (Contains PHI)
          </div>
        </div>
        <pre style={{ fontSize: 12, lineHeight: 1.7, color: '#8ba3c7', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 320, overflowY: 'auto' }}>
          {original}
        </pre>
      </div>

      {/* Redacted */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#34d399', display: 'flex', gap: 6, alignItems: 'center' }}>
            <ShieldCheck size={14} /> De-Identified Document
          </div>
        </div>
        <pre style={{ fontSize: 12, lineHeight: 1.7, color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 320, overflowY: 'auto' }}>
          {highlightRedacted(redacted)}
        </pre>
      </div>
    </div>
  )
}

function PHITable({ findings }) {
  if (!findings?.length) return (
    <div style={{ textAlign: 'center', padding: 32, color: '#4a6285' }}>
      <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
      <div>No PHI detected in this document.</div>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Type', 'Category', 'Severity', 'Original Value', 'Replacement'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a6285', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '10px 12px', fontWeight: 700, color: SEVERITY_COLORS[f.severity] || '#8ba3c7' }}>{f.type}</td>
              <td style={{ padding: '10px 12px', color: '#8ba3c7' }}>{f.category}</td>
              <td style={{ padding: '10px 12px' }}>
                <span className={`badge badge-${f.severity?.toLowerCase()}`}>{f.severity}</span>
              </td>
              <td style={{ padding: '10px 12px', color: '#f87171', fontFamily: 'monospace', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {f.original_text}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span className="phi-highlight" style={{ fontSize: 11 }}>{f.replacement}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DeIdentify() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'text'
  const [textInput, setTextInput] = useState(SAMPLE_TEXT)
  const [activeView, setActiveView] = useState('preview') // 'preview' | 'table'

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post('/api/deidentify/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please try again.')
    } finally { setLoading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'image/*': ['.png', '.jpg', '.jpeg'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1
  })

  const handleTextAnalyze = async () => {
    if (!textInput.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await axios.post('/api/deidentify/text', { text: textInput })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed.')
    } finally { setLoading(false) }
  }

  const downloadRedacted = () => {
    if (!result) return
    const blob = new Blob([result.redacted_text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'deidentified_document.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#4a6285', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>HIPAA-STYLE PRIVACY PROTECTION</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
          <span className="gradient-text">PHI De-Identification</span> Engine
        </h1>
        <p style={{ color: '#8ba3c7', marginTop: 6, fontSize: 14 }}>
          Upload a clinical document or paste text. All Protected Health Information will be automatically detected and redacted.
        </p>
      </div>

      {/* Feature badges */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {['Names & Titles', 'Dates & Ages', 'Phone & Email', 'SSN & MRN', 'ZIP Codes', 'IP Addresses', 'Account Numbers', 'NPI Numbers'].map(f => (
          <div key={f} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#8ba3c7' }}>
            ✓ {f}
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['upload', '📄 Upload File'], ['text', '✏️ Paste Text']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={activeTab === key ? 'btn-primary' : 'btn-secondary'}>
            {label}
          </button>
        ))}
      </div>

      {/* Input area */}
      {activeTab === 'upload' ? (
        <div className={`upload-zone${isDragActive ? ' active' : ''}`}
          {...getRootProps()} style={{ padding: 56, textAlign: 'center', marginBottom: 20 }}>
          <input {...getInputProps()} />
          <Upload size={40} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
            {isDragActive ? 'Drop your document here' : 'Drag & drop a medical document'}
          </div>
          <div style={{ color: '#8ba3c7', fontSize: 13 }}>Supports PDF, DOCX, TXT, PNG, JPG · Max 10MB</div>
          <button className="btn-secondary" style={{ marginTop: 16 }}>Browse Files</button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#8ba3c7', marginBottom: 10 }}>
            Paste clinical text below (sample loaded for demo):
          </div>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            style={{
              width: '100%', minHeight: 220, background: 'rgba(5,11,24,0.6)',
              border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10,
              color: '#f0f6ff', fontFamily: 'monospace', fontSize: 13, padding: 14,
              resize: 'vertical', outline: 'none', lineHeight: 1.6
            }}
          />
          <button onClick={handleTextAnalyze} disabled={loading} className="btn-primary" style={{ marginTop: 12 }}>
            {loading ? <><div className="spinner" /> Analyzing…</> : <><ShieldCheck size={15} /> Analyze & De-Identify</>}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
          <div style={{ color: '#8ba3c7' }}>Processing document…</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card" style={{ padding: 16, borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <div style={{ color: '#f87171', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-slide-in">
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f87171' }}>{result.total_phi_count}</div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>PHI Items Found</div>
            </div>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f97316' }}>{result.severity_counts?.CRITICAL || 0}</div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>Critical (SSN, etc.)</div>
            </div>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa' }}>{Object.keys(result.type_distribution || {}).length}</div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>PHI Categories</div>
            </div>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <span className={`badge badge-${result.risk_level?.toLowerCase()}`} style={{ fontSize: 14, padding: '6px 14px', marginTop: 4 }}>
                {result.risk_level}
              </span>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 8 }}>Privacy Risk</div>
            </div>
          </div>

          {/* View tabs + download */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['preview', '👁 Document Preview'], ['table', '📋 PHI Details Table']].map(([key, label]) => (
                <button key={key} onClick={() => setActiveView(key)}
                  className={activeView === key ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12, padding: '7px 14px' }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={downloadRedacted} className="btn-secondary" style={{ fontSize: 12 }}>
              <Download size={13} /> Download Redacted
            </button>
          </div>

          {activeView === 'preview'
            ? <RedactedPreview original={result.original_text} redacted={result.redacted_text} findings={result.phi_findings} />
            : <div className="glass-card" style={{ padding: 20 }}><PHITable findings={result.phi_findings} /></div>
          }

          {/* Compliance note */}
          <div style={{ marginTop: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#34d399', display: 'flex', gap: 8, alignItems: 'center' }}>
            <CheckCircle size={14} /> {result.compliance_note}
          </div>
        </div>
      )}
    </div>
  )
}
