import { ShieldCheck, Brain, DatabaseZap, Scale, Heart, Microscope, Globe, Award, ChevronRight } from 'lucide-react'

const TECH_STACK = [
  { category: 'Frontend', items: ['React 18 + Vite', 'TailwindCSS', 'Recharts', 'React Router', 'Axios'] },
  { category: 'Backend', items: ['Python FastAPI', 'Uvicorn ASGI', 'PyMuPDF (PDF)', 'Pytesseract (OCR)', 'Python-docx'] },
  { category: 'AI / NLP', items: ['Regex NLP Engine', 'Medical Vocabulary Matching', 'Pharmacological Rules', 'Cross-reactivity Maps', 'Confidence Scoring'] },
  { category: 'Privacy', items: ['HIPAA Safe Harbor', '12+ PHI Patterns', 'Direct Identifiers', 'Quasi-identifiers', 'Audit Logging'] },
]

const ETHICS = [
  { icon: <ShieldCheck size={20} color="#60a5fa" />, title: 'No Real Patient Data', desc: 'All demonstrations use Synthea-generated synthetic records. Zero real PHI ever processed or stored.' },
  { icon: <Scale size={20} color="#34d399" />, title: 'HIPAA Safe Harbor Alignment', desc: 'De-identification follows the 18 identifier categories defined in HIPAA Safe Harbor method.' },
  { icon: <Brain size={20} color="#a78bfa" />, title: 'Explainable AI', desc: 'Every contradiction includes a step-by-step reasoning trace. No black-box decisions.' },
  { icon: <Microscope size={20} color="#fb923c" />, title: 'Confidence Thresholds', desc: 'Only contradictions with >75% confidence are surfaced to prevent alert fatigue.' },
]

const WORKFLOW = [
  { step: '01', label: 'Document Upload', desc: 'PDF, DOCX, Images or raw text accepted via secure upload interface.' },
  { step: '02', label: 'OCR Extraction', desc: 'PyMuPDF extracts text from PDFs; Tesseract OCR processes scanned documents.' },
  { step: '03', label: 'PHI Detection', desc: '12 regex-based HIPAA identifier patterns scan for names, dates, SSNs, MRNs, and more.' },
  { step: '04', label: 'Entity Extraction', desc: 'Medical NLP identifies diagnoses, medications (with doses), lab values, vitals, and allergies.' },
  { step: '05', label: 'Contradiction Engine', desc: 'Rule layer checks allergy-medication conflicts, contraindications, and diagnosis mismatches.' },
  { step: '06', label: 'Risk Scoring', desc: 'Each contradiction contributes severity-weighted points to a 0-100 patient risk score.' },
  { step: '07', label: 'Explainable Output', desc: 'Every finding presents a transparent reasoning trace with source document references.' },
]

export default function About() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }} className="animate-slide-in">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(8,145,178,0.08) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 20, padding: 48, marginBottom: 40, textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #2563eb, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(59,130,246,0.4)'
          }}>
            <Heart size={36} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 900, fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', marginBottom: 12 }}>
          <span className="gradient-text">MedGuard AI</span>
        </h1>
        <div style={{ fontSize: 16, color: '#8ba3c7', maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.7 }}>
          A Clinical Document Intelligence Platform designed to improve patient safety and healthcare data privacy through automated PHI de-identification and AI-powered contradiction detection.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-blue" style={{ fontSize: 13, padding: '6px 14px' }}>Cognitva Healthcare AI Challenge</span>
          <span className="badge badge-emerald" style={{ padding: '6px 14px', fontSize: 13 }}>Synthetic Data Only</span>
          <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', fontSize: 13, padding: '6px 14px' }}>Open Source</span>
        </div>
      </div>

      {/* System workflow */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, fontFamily: 'Space Grotesk' }}>System Workflow</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 14 }}>
          {WORKFLOW.map((w, i) => (
            <div key={i} className="glass-card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(8,145,178,0.2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#60a5fa', fontFamily: 'Space Grotesk'
              }}>
                {w.step}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{w.label}</div>
                <div style={{ fontSize: 12, color: '#8ba3c7', lineHeight: 1.5 }}>{w.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ethics & compliance */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, fontFamily: 'Space Grotesk' }}>Ethics & Compliance</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 14 }}>
          {ETHICS.map((e, i) => (
            <div key={i} className="glass-card" style={{ padding: 22 }}>
              <div style={{ marginBottom: 10 }}>{e.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: '#8ba3c7', lineHeight: 1.6 }}>{e.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, fontFamily: 'Space Grotesk' }}>Technology Stack</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
          {TECH_STACK.map((t, i) => (
            <div key={i} className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>{t.category}</div>
              {t.items.map((item, j) => (
                <div key={j} style={{ fontSize: 12, color: '#8ba3c7', padding: '4px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <ChevronRight size={10} color="#3b82f6" />{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dataset disclaimer */}
      <div style={{
        background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
        borderRadius: 14, padding: 24
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#facc15', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Award size={16} /> Dataset & Privacy Statement
        </div>
        <div style={{ fontSize: 13, color: '#8ba3c7', lineHeight: 1.7 }}>
          MedGuard AI uses exclusively <strong style={{ color: '#f0f6ff' }}>Synthea-generated synthetic patient data</strong> for all demonstrations. 
          No real Protected Health Information (PHI) is stored, processed, or transmitted through this platform. 
          The system is designed for educational and research purposes, aligned with HIPAA Safe Harbor de-identification principles. 
          All contradictions shown in demo mode are based on clinically plausible but entirely fictional patient records.
        </div>
      </div>
    </div>
  )
}
