import { useState } from 'react'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import {
  Clock, AlertTriangle, CheckCircle, Upload, Zap,
  Activity, Pill, TestTube, ShieldAlert, Heart, FileText, LogIn, LogOut
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const EVENT_ICONS = {
  DIAGNOSIS: <Activity size={14} />,
  MEDICATION: <Pill size={14} />,
  LAB: <TestTube size={14} />,
  ALLERGY: <ShieldAlert size={14} />,
  VITAL: <Heart size={14} />,
  PROCEDURE: <FileText size={14} />,
  NOTE: <FileText size={14} />,
  ADMISSION: <LogIn size={14} />,
  DISCHARGE: <LogOut size={14} />,
}

function TimelineEvent({ event, index, isLast }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      {/* Left column: connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
        {/* Circle */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: event.has_conflict
            ? 'rgba(239,68,68,0.15)' : `${event.color}22`,
          border: `2px solid ${event.has_conflict ? '#ef4444' : event.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: event.has_conflict ? '#f87171' : event.color,
          flexShrink: 0, zIndex: 2, position: 'relative',
          boxShadow: event.has_conflict ? '0 0 12px rgba(239,68,68,0.3)' : `0 0 8px ${event.color}33`
        }}>
          {EVENT_ICONS[event.event_type] || <Clock size={14} />}
        </div>
        {/* Vertical line */}
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 24,
            background: `linear-gradient(180deg, ${event.color}88 0%, rgba(255,255,255,0.06) 100%)`
          }} />
        )}
      </div>

      {/* Right column: content */}
      <div style={{ flex: 1, paddingLeft: 14, paddingBottom: isLast ? 0 : 20 }}>
        <div className="glass-card" style={{
          padding: '14px 16px',
          borderColor: event.has_conflict ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.1)',
          cursor: event.has_conflict ? 'pointer' : 'default',
          transition: 'all 0.2s'
        }}
          onClick={() => event.has_conflict && setExpanded(e => !e)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              {/* Header row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: event.color, background: `${event.color}18`, border: `1px solid ${event.color}44`,
                  borderRadius: 4, padding: '2px 7px'
                }}>
                  {event.event_type}
                </span>
                {event.has_conflict && (
                  <span className="badge badge-critical" style={{ fontSize: 10 }}>⚠ CONFLICT</span>
                )}
              </div>

              {/* Description */}
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{event.description}</div>

              {/* Source doc */}
              <div style={{ fontSize: 11, color: '#4a6285', marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <FileText size={11} /> {event.source_doc}
                {event.day_label && event.day_label !== '—' && (
                  <span style={{ color: '#6b7280' }}>· {event.day_label}</span>
                )}
              </div>

              {/* Conflict note expanded */}
              {expanded && event.conflict_note && (
                <div className="animate-fade-in" style={{
                  marginTop: 10, background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 12px',
                  fontSize: 12, color: '#fca5a5', lineHeight: 1.5
                }}>
                  <AlertTriangle size={12} style={{ display: 'inline', marginRight: 5 }} />
                  {event.conflict_note}
                </div>
              )}
            </div>

            {/* Date badge */}
            <div style={{
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#8ba3c7',
              whiteSpace: 'nowrap', flexShrink: 0
            }}>
              {event.date}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EventTypeChart({ distribution }) {
  const data = Object.entries(distribution || {}).map(([type, count]) => ({ type, count }))
  if (!data.length) return null

  const COLORS = {
    DIAGNOSIS: '#3b82f6', MEDICATION: '#10b981', LAB: '#f59e0b',
    ALLERGY: '#ef4444', VITAL: '#8b5cf6', NOTE: '#6b7280',
    ADMISSION: '#f97316', DISCHARGE: '#84cc16', PROCEDURE: '#06b6d4'
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#8ba3c7', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="type" tick={{ fill: '#8ba3c7', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: '#f0f6ff' }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={COLORS[entry.type] || '#6b7280'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Timeline() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')

  const loadDemo = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await axios.get('/api/timeline/demo')
      setResult(res.data)
    } catch { setError('Failed to load demo timeline.') }
    finally { setLoading(false) }
  }

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    multiple: true, maxFiles: 8,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'image/*': ['.png', '.jpg'] }
  })

  const analyzeFiles = async () => {
    if (!acceptedFiles.length) return
    setLoading(true); setError(null); setResult(null)
    const form = new FormData()
    acceptedFiles.forEach(f => form.append('files', f))
    try {
      const res = await axios.post('/api/timeline/build', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data)
    } catch (e) { setError(e.response?.data?.detail || 'Timeline build failed.') }
    finally { setLoading(false) }
  }

  const EVENT_TYPES = ['ALL', 'DIAGNOSIS', 'MEDICATION', 'LAB', 'ALLERGY', 'VITAL', 'NOTE', 'ADMISSION']

  const filteredEvents = result?.events?.filter(e =>
    filter === 'ALL' ? true :
    filter === 'CONFLICT' ? e.has_conflict :
    e.event_type === filter
  ) || []

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#4a6285', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>TEMPORAL CLINICAL REASONING</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
          <span className="gradient-text">Patient</span> Timeline Engine
        </h1>
        <p style={{ color: '#8ba3c7', marginTop: 6, fontSize: 14 }}>
          Reconstructs a chronological patient history from clinical documents. Detects temporal contradictions doctors miss across separate records.
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={loadDemo} disabled={loading} className="btn-primary">
          {loading ? <><div className="spinner" /> Building…</> : <><Zap size={14} /> Load Demo Timeline</>}
        </button>
        <span style={{ color: '#4a6285', alignSelf: 'center', fontSize: 13 }}>or</span>
        <div {...getRootProps()} className="upload-zone" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input {...getInputProps()} />
          <Upload size={14} color="#3b82f6" />
          {isDragActive ? 'Drop files…' : acceptedFiles.length > 0 ? `${acceptedFiles.length} files ready` : 'Upload Documents'}
        </div>
        {acceptedFiles.length > 0 && (
          <button onClick={analyzeFiles} disabled={loading} className="btn-secondary">
            <Activity size={14} /> Build Timeline
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card" style={{ padding: 14, borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <span style={{ color: '#f87171' }}><AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />{error}</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="animate-slide-in">
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#60a5fa' }}>{result.event_count}</div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>Timeline Events</div>
            </div>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: result.conflict_count > 0 ? '#ef4444' : '#34d399' }}>
                {result.conflict_count}
              </div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>Temporal Conflicts</div>
            </div>
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#f59e0b' }}>
                {Object.keys(result.event_type_distribution || {}).length}
              </div>
              <div style={{ fontSize: 12, color: '#8ba3c7', marginTop: 4 }}>Event Categories</div>
            </div>
            {result.demo && (
              <div className="glass-card" style={{ padding: 18, textAlign: 'center', borderColor: 'rgba(234,179,8,0.2)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#facc15', marginBottom: 6 }}>⚡ DEMO MODE</div>
                <div style={{ fontSize: 11, color: '#8ba3c7' }}>Synthea synthetic data</div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Event type distribution */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Event Distribution by Type</div>
              <EventTypeChart distribution={result.event_type_distribution} />
            </div>

            {/* Quick stats */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Conflict Summary</div>
              {result.events?.filter(e => e.has_conflict).slice(0, 5).map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: '#fca5a5', padding: '5px 0', borderBottom: '1px solid rgba(239,68,68,0.1)', lineHeight: 1.4 }}>
                  ⚠️ {e.event_type}: {e.description.substring(0, 60)}…
                </div>
              ))}
              {result.conflict_count === 0 && <div style={{ color: '#4a6285', fontSize: 12 }}>No temporal conflicts found.</div>}
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', 'CONFLICT', ...Object.keys(result.event_type_distribution || {})].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={filter === f ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: 11, padding: '5px 12px' }}>
                {f === 'CONFLICT' ? '⚠️ Conflicts Only' : f}
                {f === 'CONFLICT' && result.conflict_count > 0 && (
                  <span style={{ marginLeft: 4, background: '#ef4444', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                    {result.conflict_count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Clock size={16} color="#60a5fa" />
              Patient Clinical Timeline
              <span style={{ marginLeft: 8, fontSize: 12, color: '#4a6285' }}>({filteredEvents.length} events)</span>
            </div>

            {filteredEvents.length === 0
              ? <div style={{ textAlign: 'center', padding: 32, color: '#4a6285' }}>No events match this filter.</div>
              : filteredEvents.map((event, i) => (
                <TimelineEvent key={i} event={event} index={i} isLast={i === filteredEvents.length - 1} />
              ))
            }
          </div>

          {result.demo && (
            <div style={{ marginTop: 12, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: '#facc15' }}>
              ⚠️ All timeline events are from Synthea-generated synthetic records. No real patient data.
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="glass-card" style={{ padding: 64, textAlign: 'center' }}>
          <Clock size={48} color="#3b82f6" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#8ba3c7', marginBottom: 8 }}>No timeline loaded</div>
          <div style={{ fontSize: 13, color: '#4a6285' }}>Click "Load Demo Timeline" to see a synthetic patient's full clinical history with temporal contradictions.</div>
        </div>
      )}
    </div>
  )
}
