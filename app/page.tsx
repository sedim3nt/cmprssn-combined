'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DIAGNOSTIC_QUESTIONS, type Answer, type DiagnosticAnswers, calculateScores } from '@/lib/diagnostic';
import { SURVEY_QUESTIONS, type SurveyAnswers } from '@/lib/survey';
import { encodeAll } from '@/lib/encode';

type Phase = 'landing' | 'diagnostic' | 'phase-transition' | 'survey' | 'analyzing';

const TOTAL_Q = 22;
const DIAGNOSTIC_COUNT = 10;
const SURVEY_COUNT = 12;

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('landing');
  const [diagIdx, setDiagIdx] = useState(0);
  const [surveyIdx, setSurveyIdx] = useState(0);
  const [diagAnswers, setDiagAnswers] = useState<Partial<DiagnosticAnswers>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Partial<SurveyAnswers>>({});
  const [selected, setSelected] = useState<string | string[] | null>(null);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const [transitionScore, setTransitionScore] = useState<number | null>(null);
  const [dotCount, setDotCount] = useState(0);

  // Dot animation for analyzing
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const iv = setInterval(() => setDotCount(d => (d + 1) % 4), 400);
    return () => clearInterval(iv);
  }, [phase]);

  // Navigate to results after analyzing
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const t = setTimeout(() => {
      const qs = encodeAll(diagAnswers, surveyAnswers);
      router.push(`/results?${qs}`);
    }, 2200);
    return () => clearTimeout(t);
  }, [phase, diagAnswers, surveyAnswers, router]);

  // Sync selected with current answer
  useEffect(() => {
    if (phase === 'diagnostic') {
      const key = `q${diagIdx + 1}` as keyof DiagnosticAnswers;
      const cur = diagAnswers[key];
      setSelected(cur !== undefined ? String(cur) : null);
    } else if (phase === 'survey') {
      const q = SURVEY_QUESTIONS[surveyIdx];
      const key = `q${q.id}` as keyof SurveyAnswers;
      const cur = surveyAnswers[key];
      if (q.type === 'multi') {
        setSelected((cur as string[] | undefined) || []);
      } else {
        setSelected(cur !== undefined ? String(cur) : null);
      }
    }
  }, [phase, diagIdx, surveyIdx, diagAnswers, surveyAnswers]);

  const handleStart = () => {
    setPhase('diagnostic');
    setDiagIdx(0);
  };

  const handleDiagSelect = useCallback((val: string) => {
    if (animating) return;
    setSelected(val);
    const key = `q${diagIdx + 1}` as keyof DiagnosticAnswers;
    const numVal = parseInt(val) as Answer;
    const newAnswers = { ...diagAnswers, [key]: numVal };
    setDiagAnswers(newAnswers);

    setTimeout(() => {
      setAnimating(true);
      setAnimDir('forward');
      setTimeout(() => {
        if (diagIdx < DIAGNOSTIC_COUNT - 1) {
          setDiagIdx(i => i + 1);
        } else {
          // Phase transition
          const scores = calculateScores(newAnswers as DiagnosticAnswers);
          setTransitionScore(scores.overall);
          setPhase('phase-transition');
        }
        setAnimating(false);
      }, 350);
    }, 300);
  }, [animating, diagIdx, diagAnswers]);

  const handleSurveyAnswer = useCallback((val: string | string[]) => {
    if (animating) return;
    const q = SURVEY_QUESTIONS[surveyIdx];
    if (q.type === 'multi') {
      const arr = selected as string[] || [];
      const s = typeof val === 'string' ? val : val[0];
      const newArr = arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s];
      setSelected(newArr);
      const key = `q${q.id}` as keyof SurveyAnswers;
      setSurveyAnswers(prev => ({ ...prev, [key]: newArr }));
    } else {
      setSelected(val as string);
      const key = `q${q.id}` as keyof SurveyAnswers;
      setSurveyAnswers(prev => ({ ...prev, [key]: val as string }));
    }
  }, [animating, surveyIdx, selected]);

  const handleSurveyNext = useCallback(() => {
    if (animating) return;
    const q = SURVEY_QUESTIONS[surveyIdx];
    // Save text if q18/q19
    if (q.type === 'text') {
      // already updated via onChange
    }
    setAnimating(true);
    setAnimDir('forward');
    setTimeout(() => {
      if (surveyIdx < SURVEY_COUNT - 1) {
        setSurveyIdx(i => i + 1);
      } else {
        setPhase('analyzing');
      }
      setAnimating(false);
    }, 350);
  }, [animating, surveyIdx]);

  const handleBack = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setAnimDir('back');
    setTimeout(() => {
      if (phase === 'survey') {
        if (surveyIdx === 0) {
          setPhase('phase-transition');
        } else {
          setSurveyIdx(i => i - 1);
        }
      } else if (phase === 'diagnostic') {
        if (diagIdx === 0) {
          setPhase('landing');
        } else {
          setDiagIdx(i => i - 1);
        }
      }
      setAnimating(false);
    }, 300);
  }, [animating, phase, diagIdx, surveyIdx]);

  const globalProgress = phase === 'diagnostic'
    ? diagIdx / TOTAL_Q
    : phase === 'phase-transition'
    ? DIAGNOSTIC_COUNT / TOTAL_Q
    : phase === 'survey'
    ? (DIAGNOSTIC_COUNT + surveyIdx) / TOTAL_Q
    : phase === 'analyzing'
    ? 1
    : 0;

  const animClass = animating
    ? animDir === 'forward' ? 'animate-slide-left' : 'animate-slide-right'
    : 'animate-fade-in';

  /* ── LANDING ── */
  if (phase === 'landing') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 60px)' }}>
        <div style={{ maxWidth: '640px', width: '100%', animation: 'fadeIn 600ms ease' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-display)', letterSpacing: '0.12em',
              color: 'var(--text-tertiary)', textTransform: 'uppercase',
            }}>
              CMPRSSN · Q2 2026 Field Study
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--frost)',
            marginBottom: '24px',
          }}>
            Complete<br/>
            <span className="gradient-text">Assessment</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '520px' }}>
            The full CMPRSSN instrument in one pass. 10-question diagnostic + 12-question operational survey.
            Takes about 5 minutes. No signup required.
          </p>

          {/* Phase indicators */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--signal)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Phase 1
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Composition Diagnostic · 10 questions</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px',
              background: 'rgba(124, 110, 191, 0.08)',
              border: '1px solid rgba(124, 110, 191, 0.2)',
              borderRadius: '6px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--steel)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--steel)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Phase 2
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Operational Context · 12 questions</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            style={{
              padding: '16px 36px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,110,191,0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              borderRadius: '8px',
              color: 'var(--frost)',
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 250ms ease',
              boxShadow: '0 0 24px rgba(139, 92, 246, 0.15)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.8)';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.15)';
            }}
          >
            Begin Assessment →
          </button>

          <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Built by Sedim3nt · CMPRSSN Q2 2026 · Your data is used for research only
          </p>
        </div>
      </main>
    );
  }

  /* ── ANALYZING ── */
  if (phase === 'analyzing') {
    const dots = '.'.repeat(dotCount);
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', animation: 'fadeIn 400ms ease' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--signal)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px',
          }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--signal)', letterSpacing: '0.08em' }}>
            Analyzing composition{dots}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  /* ── PHASE TRANSITION ── */
  if (phase === 'phase-transition') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center', animation: 'fadeIn 600ms ease' }}>
          <div style={{
            padding: '48px 40px',
            background: 'rgba(14, 26, 46, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            marginBottom: '32px',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '4px 14px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '20px',
                marginBottom: '20px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--signal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Phase 1 Complete
                </span>
              </div>
            </div>

            <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Your Diagnostic Score
            </p>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 10vw, 5rem)',
              lineHeight: 1,
              color: 'var(--signal)',
              textShadow: '0 0 40px rgba(139, 92, 246, 0.5)',
              marginBottom: '8px',
            }}>
              {transitionScore?.toFixed(1)}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>out of 5.0</p>
          </div>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px' }}>
            Now for Phase 2: 12 questions about your operational context. This is where we map the gap between
            diagnostic score and real-world practice.
          </p>

          <button
            onClick={() => { setSurveyIdx(0); setPhase('survey'); }}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,110,191,0.1) 100%)',
              border: '1px solid rgba(139,92,246,0.5)',
              borderRadius: '8px',
              color: 'var(--frost)',
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 250ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; }}
          >
            Continue to Phase 2 →
          </button>
        </div>
      </main>
    );
  }

  /* ── DIAGNOSTIC QUIZ ── */
  if (phase === 'diagnostic') {
    const q = DIAGNOSTIC_QUESTIONS[diagIdx];
    const questionKey = `q${q.id}` as keyof DiagnosticAnswers;
    const currentVal = diagAnswers[questionKey];

    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'clamp(24px, 5vw, 48px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={handleBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-display)', padding: '4px' }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${globalProgress * 100}%` }} />
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
            {diagIdx + 1} / {TOTAL_Q}
          </span>
        </div>

        {/* Phase indicator */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '20px',
            fontFamily: 'var(--font-display)', fontSize: '11px',
            color: 'var(--signal)', letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Phase 1 · Composition Diagnostic
          </span>
        </div>

        {/* Question */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <div className={animClass} style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {q.dimension}
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)',
              lineHeight: 1.3,
              color: 'var(--frost)',
              marginBottom: '32px',
            }}>
              {q.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  className={`option-btn ${currentVal === opt.value ? 'selected' : ''}`}
                  onClick={() => handleDiagSelect(String(opt.value))}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: `2px solid ${currentVal === opt.value ? 'var(--signal)' : 'var(--border-strong)'}`,
                      background: currentVal === opt.value ? 'var(--signal)' : 'transparent',
                      flexShrink: 0, marginTop: '2px',
                      boxShadow: currentVal === opt.value ? 'var(--signal-glow)' : 'none',
                      transition: 'all 200ms ease',
                    }} />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: currentVal === opt.value ? 'var(--frost)' : 'var(--text-secondary)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {opt.sublabel}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── SURVEY ── */
  if (phase === 'survey') {
    const q = SURVEY_QUESTIONS[surveyIdx];
    const qKey = `q${q.id}` as keyof SurveyAnswers;
    const isMulti = q.type === 'multi';
    const isText = q.type === 'text';
    const currentMulti = (surveyAnswers[qKey] as string[] | undefined) || [];
    const currentSingle = surveyAnswers[qKey] as string | undefined;
    const hasAnswer = isMulti
      ? currentMulti.length > 0
      : isText
      ? ((surveyAnswers[qKey] as string) || '').trim().length > 0
      : currentSingle !== undefined;

    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'clamp(24px, 5vw, 48px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={handleBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-display)', padding: '4px' }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${globalProgress * 100}%` }} />
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
            {DIAGNOSTIC_COUNT + surveyIdx + 1} / {TOTAL_Q}
          </span>
        </div>

        {/* Phase indicator */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            background: 'rgba(124, 110, 191, 0.1)',
            border: '1px solid rgba(124, 110, 191, 0.3)',
            borderRadius: '20px',
            fontFamily: 'var(--font-display)', fontSize: '11px',
            color: 'var(--steel)', letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Phase 2 · Operational Context
          </span>
        </div>

        {/* Question */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <div className={animClass}>
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {q.dimension}
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
              lineHeight: 1.35,
              color: 'var(--frost)',
              marginBottom: '28px',
            }}>
              {q.question}
            </h2>

            {/* Single select */}
            {q.type === 'single' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map(opt => (
                  <button
                    key={opt.value}
                    className={`option-btn ${currentSingle === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      handleSurveyAnswer(opt.value);
                      setTimeout(() => handleSurveyNext(), 300);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        border: `2px solid ${currentSingle === opt.value ? 'var(--signal)' : 'var(--border-strong)'}`,
                        background: currentSingle === opt.value ? 'var(--signal)' : 'transparent',
                        flexShrink: 0, marginTop: '2px',
                        transition: 'all 200ms ease',
                      }} />
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: currentSingle === opt.value ? 'var(--frost)' : 'var(--text-secondary)' }}>
                          {opt.label}
                        </div>
                        {'sublabel' in opt && (
                          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Multi-select */}
            {q.type === 'multi' && (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                  {q.options.map(opt => (
                    <button
                      key={opt.value}
                      className={`multi-chip ${currentMulti.includes(opt.value) ? 'selected' : ''}`}
                      onClick={() => handleSurveyAnswer(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSurveyNext}
                  disabled={!hasAnswer}
                  style={{
                    padding: '12px 28px',
                    background: hasAnswer ? 'rgba(139,92,246,0.15)' : 'transparent',
                    border: `1px solid ${hasAnswer ? 'rgba(139,92,246,0.5)' : 'var(--border-default)'}`,
                    borderRadius: '6px',
                    color: hasAnswer ? 'var(--frost)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: hasAnswer ? 'pointer' : 'not-allowed',
                    transition: 'all 200ms ease',
                  }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Text */}
            {q.type === 'text' && (
              <div>
                <textarea
                  className="signal-textarea"
                  rows={5}
                  maxLength={q.maxLength}
                  placeholder={q.placeholder}
                  value={(surveyAnswers[qKey] as string) || ''}
                  onChange={e => {
                    setSurveyAnswers(prev => ({ ...prev, [qKey]: e.target.value }));
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {((surveyAnswers[qKey] as string) || '').length} / {q.maxLength}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        // Skip (leave empty)
                        handleSurveyNext();
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        borderRadius: '6px',
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-display)',
                        fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleSurveyNext}
                      style={{
                        padding: '10px 24px',
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.5)',
                        borderRadius: '6px',
                        color: 'var(--frost)',
                        fontFamily: 'var(--font-display)',
                        fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return null;
}
