'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  calculateScores, getTier, DIMENSION_INTERPRETATIONS,
  type DiagnosticAnswers, TIERS,
} from '@/lib/diagnostic';
import { calculateOMI, calculateQuadrant, generateDNA } from '@/lib/survey';
import { decodeAll } from '@/lib/encode';
import { saveResponse } from '@/lib/supabase';
import { saveCombinedToAirtable } from '@/lib/airtable';

const DIMENSION_LABELS = {
  fleetDepth: 'Fleet Depth',
  governance: 'Governance',
  autonomy: 'Autonomy',
  composability: 'Composability',
  compression: 'Compression',
} as const;
type DimensionKey = keyof typeof DIMENSION_LABELS;
const DIMENSION_KEYS: DimensionKey[] = ['fleetDepth', 'governance', 'autonomy', 'composability', 'compression'];

function DNAPattern({ dna, size = 240 }: { dna: string; size?: number }) {
  const cells = useMemo(() => {
    const cols = 8;
    const rows = 4;
    return Array.from({ length: rows * cols }, (_, i) => {
      const hexChar = dna[i % dna.length] || '0';
      const val = parseInt(hexChar, 16) / 15;
      return val;
    });
  }, [dna]);

  const cols = 8;
  const rows = 4;
  const cellW = size / cols;
  const cellH = (size / 2) / rows;

  return (
    <svg width={size} height={size / 2} style={{ display: 'block' }}>
      {cells.map((val, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const opacity = 0.15 + val * 0.7;
        const colorVal = Math.floor(val * 255);
        const r = Math.min(255, 139 + colorVal * 0.4);
        const g = Math.max(0, 92 - colorVal * 0.2);
        const b = Math.min(255, 246 - colorVal * 0.1);
        return (
          <rect
            key={i}
            x={col * cellW + 1}
            y={row * cellH + 1}
            width={cellW - 2}
            height={cellH - 2}
            rx={2}
            fill={`rgba(${r},${g},${b},${opacity})`}
          />
        );
      })}
    </svg>
  );
}

function GapIndicator({ label, diagnostic, operational }: { label: string; diagnostic: number; operational: number }) {
  const gap = diagnostic - operational;
  const absGap = Math.abs(gap);
  const isOverconf = gap > 0;
  const color = absGap > 1 ? '#F87171' : absGap > 0.5 ? '#FBBF24' : '#86EFAC';

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: '12px', color, fontFamily: 'var(--font-display)' }}>
          {absGap < 0.15 ? 'Aligned' : isOverconf ? `+${gap.toFixed(1)} gap` : `${gap.toFixed(1)} gap`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px', textAlign: 'right', fontFamily: 'var(--font-display)' }}>Diag</span>
        <div style={{ flex: 1, height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((diagnostic - 1) / 4) * 100}%`, background: 'var(--signal)', borderRadius: '3px', transition: 'width 800ms ease' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--signal)', width: '28px' }}>{diagnostic.toFixed(1)}</span>
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '3px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px', textAlign: 'right', fontFamily: 'var(--font-display)' }}>Survey</span>
        <div style={{ flex: 1, height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((operational - 1) / 4) * 100}%`, background: color, borderRadius: '3px', transition: 'width 800ms ease' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color, width: '28px' }}>{operational.toFixed(1)}</span>
      </div>
    </div>
  );
}

function ResultsInner() {
  const searchParams = useSearchParams();
  const [shareMsg, setShareMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setBarsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const { diagnostic: diagAnswers, survey: surveyAnswers } = useMemo(() => {
    return decodeAll(searchParams.toString());
  }, [searchParams]);

  const allDiagAnswered = useMemo(() =>
    (['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'] as (keyof DiagnosticAnswers)[])
      .every(k => diagAnswers[k] !== undefined),
    [diagAnswers]
  );

  const scores = useMemo(() => {
    if (!allDiagAnswered) return null;
    return calculateScores(diagAnswers as DiagnosticAnswers);
  }, [diagAnswers, allDiagAnswered]);

  const tier = useMemo(() => scores ? getTier(scores.overall) : null, [scores]);

  const omi = useMemo(() => {
    if (!scores) return 0;
    return calculateOMI(scores.overall, surveyAnswers);
  }, [scores, surveyAnswers]);

  const { quadrant, x: autonomyX, y: govY } = useMemo(() => {
    if (!scores) return { quadrant: 'Observer', x: 0, y: 0 };
    return calculateQuadrant(scores.autonomy, surveyAnswers);
  }, [scores, surveyAnswers]);

  const dna = useMemo(() => {
    if (!allDiagAnswered) return '0000000000000000000000';
    return generateDNA(
      diagAnswers as unknown as Record<string, number>,
      surveyAnswers
    );
  }, [diagAnswers, surveyAnswers, allDiagAnswered]);

  const radarData = useMemo(() => {
    if (!scores) return [];
    return DIMENSION_KEYS.map(k => ({
      dimension: DIMENSION_LABELS[k],
      score: scores[k],
      fullMark: 5,
    }));
  }, [scores]);

  // Operational equivalents from survey
  const surveyScores = useMemo(() => {
    if (!surveyAnswers) return null;
    const gov = parseInt(surveyAnswers.q13 || '1');
    const audit = parseInt(surveyAnswers.q14 || '1');
    const labor = parseInt(surveyAnswers.q12 || '1');
    const outputMap: Record<string, number> = {
      'under10': 1, '10-30': 2, '30-60': 3, '60-80': 4, '80plus': 5
    };
    const output = outputMap[surveyAnswers.q20 || 'under10'] || 1;
    return { gov, audit, labor, output };
  }, [surveyAnswers]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/results?${searchParams.toString()}`;
  }, [searchParams]);

  // Save to Supabase on mount (once)
  useEffect(() => {
    if (!scores || !allDiagAnswered || saved) return;
    setSaved(true);
    saveResponse({
      diagnostic_answers: diagAnswers as Record<string, number>,
      survey_answers: surveyAnswers as Record<string, unknown>,
      diagnostic_scores: scores as unknown as Record<string, number>,
      omi_score: omi,
      quadrant,
    }).catch(console.error);
    saveCombinedToAirtable({
      diagnosticScores: scores as unknown as Record<string, number>,
      tier: tier?.name || 'Unknown',
      overallScore: scores.overall,
      surveyAnswers: surveyAnswers as Record<string, string | string[]>,
      quadrant,
      omiScore: omi,
    }).catch(console.error);
  }, [scores, allDiagAnswered, saved, diagAnswers, surveyAnswers, omi, quadrant]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMsg('Link copied!');
    } catch {
      setShareMsg(shareUrl.slice(0, 60) + '...');
    }
    setTimeout(() => setShareMsg(''), 3000);
  };

  if (!allDiagAnswered) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>No assessment data found.</p>
          <a href="/" style={{ color: 'var(--signal)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '13px' }}>
            ← Take the Assessment
          </a>
        </div>
      </main>
    );
  }

  if (!scores || !tier) return null;

  const quadrantDescriptions: Record<string, string> = {
    Sovereign:  "High autonomy + strong governance. You've built responsible independence.",
    Rogue:      "High autonomy, weak governance. Fast but exposed.",
    Supervised: "Strong governance, low autonomy. Safe but constrained.",
    Observer:   "Low autonomy + weak governance. Early stage — room to grow.",
  };

  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(24px, 5vw, 56px) clamp(16px, 5vw, 40px)' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Back */}
        <div style={{ marginBottom: '32px', animation: 'fadeIn 500ms ease' }}>
          <a href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px',
            border: '1px solid var(--border-default)',
            borderRadius: '4px',
            background: 'rgba(139,92,246,0.04)',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            fontSize: '12px', fontFamily: 'var(--font-display)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            ← Retake
          </a>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: '48px', animation: 'fadeIn 600ms ease 100ms backwards' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                Combined Assessment Result
              </p>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'var(--frost)',
              }}>
                You are a{' '}
                <span className="gradient-text">{tier.name}</span>
              </h1>
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                {tier.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Diagnostic score */}
              <div style={{
                padding: '20px 24px',
                background: 'rgba(14,26,46,0.7)',
                border: '1px solid var(--border-strong)',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: '110px',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 1, color: 'var(--signal)', textShadow: 'var(--signal-glow)' }}>
                  {scores.overall.toFixed(1)}
                </div>
                <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px' }}>
                  Diagnostic
                </div>
              </div>

              {/* OMI */}
              <div style={{
                padding: '20px 24px',
                background: 'rgba(14,26,46,0.7)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: '110px',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 1, color: '#A78BFA', textShadow: '0 0 20px rgba(167,139,250,0.4)' }}>
                  {omi}
                </div>
                <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px' }}>
                  Maturity Index
                </div>
              </div>

              {/* Quadrant */}
              <div style={{
                padding: '20px 24px',
                background: 'rgba(14,26,46,0.7)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: '110px',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', lineHeight: 1.2, color: 'var(--frost)', marginBottom: '4px' }}>
                  {quadrant}
                </div>
                <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Quadrant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-col: Radar + OMI+Tier */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: '20px',
          marginBottom: '20px',
          animation: 'fadeIn 600ms ease 200ms backwards',
        }} className="grid-2col">
          {/* Radar */}
          <div className="card-glass" style={{ padding: '28px' }}>
            <SectionHeader label="Composition Map" />
            <div style={{ height: '260px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="rgba(139,92,246,0.1)" strokeDasharray="4 4" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: 'rgba(240,232,244,0.5)', fontSize: 11, fontFamily: 'Rajdhani,sans-serif', fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(14,26,46,0.95)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: '8px',
                        color: '#F0E8F4',
                        fontSize: '13px',
                        fontFamily: 'Rajdhani,sans-serif',
                      }}
                      formatter={(val) => [typeof val === 'number' ? val.toFixed(1) : val, 'Score']}
                    />
                    <Radar
                      dataKey="score"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="rgba(139,92,246,0.12)"
                      fillOpacity={1}
                      dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 0 }}
                      isAnimationActive={mounted}
                      animationDuration={1200}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tier + OMI context */}
          <div className="card-glass" style={{ padding: '28px' }}>
            <SectionHeader label="Operator Tier" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {TIERS.slice().reverse().map(t => (
                <div key={t.name} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: t.name === tier.name ? 'rgba(139,92,246,0.1)' : 'transparent',
                  border: t.name === tier.name ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: t.name === tier.name ? 'var(--frost)' : 'var(--text-secondary)' }}>
                        {t.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{t.range}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{t.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* OMI context */}
            <div style={{
              padding: '16px',
              background: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Operational Maturity Index
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#A78BFA' }}>{omi}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(139,92,246,0.1)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: barsVisible ? `${omi}%` : '0%', background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '2px', transition: 'width 1s ease' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Combines diagnostic score with governance depth, audit trail, protocols, and output share.
              </p>
            </div>
          </div>
        </div>

        {/* 2x2 Matrix + Composition DNA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: '20px',
          marginBottom: '20px',
          animation: 'fadeIn 600ms ease 300ms backwards',
        }} className="grid-2col">
          {/* 2x2 Matrix */}
          <div className="card-glass" style={{ padding: '28px' }}>
            <SectionHeader label="Autonomy × Governance Matrix" />
            <div style={{ position: 'relative', height: '220px', marginTop: '8px' }}>
              {/* Quadrant labels */}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px' }}>
                {[
                  { label: 'Supervised', color: 'rgba(124,110,191,0.12)' },
                  { label: 'Sovereign', color: 'rgba(139,92,246,0.15)' },
                  { label: 'Observer', color: 'rgba(14,26,46,0.4)' },
                  { label: 'Rogue', color: 'rgba(251,191,36,0.08)' },
                ].map(q => (
                  <div key={q.label} style={{
                    background: q.label === quadrant ? q.color : 'rgba(14,26,46,0.3)',
                    border: q.label === quadrant ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.05)',
                    borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: q.label === quadrant ? 'var(--frost)' : 'var(--text-muted)', letterSpacing: '0.04em' }}>
                      {q.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Position dot */}
              {mounted && (
                <div style={{
                  position: 'absolute',
                  left: `${autonomyX * 90 + 5}%`,
                  bottom: `${govY * 90 + 5}%`,
                  width: '14px', height: '14px',
                  borderRadius: '50%',
                  background: 'var(--signal)',
                  boxShadow: 'var(--signal-glow)',
                  transform: 'translate(-50%, 50%)',
                  transition: 'all 1s cubic-bezier(0,0,0.2,1)',
                  zIndex: 2,
                }} />
              )}
            </div>
            {/* Axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Low Autonomy</span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>→ Autonomy →</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>High Autonomy</span>
            </div>
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--frost)', fontFamily: 'var(--font-display)' }}>{quadrant}</strong> — {quadrantDescriptions[quadrant]}
            </p>
          </div>

          {/* Composition DNA */}
          <div className="card-glass" style={{ padding: '28px' }}>
            <SectionHeader label="Composition DNA" />
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
              A unique hex pattern generated from all 22 answers. Shareable fingerprint of your composition.
            </p>
            {mounted && <DNAPattern dna={dna} size={280} />}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                background: 'rgba(139,92,246,0.06)',
                padding: '4px 8px',
                borderRadius: '4px',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {dna}
              </code>
              <button
                onClick={handleShare}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '4px',
                  color: 'var(--signal)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {shareMsg || 'Share →'}
              </button>
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        {surveyScores && (
          <div className="card-glass" style={{ padding: '28px', marginBottom: '20px', animation: 'fadeIn 600ms ease 400ms backwards' }}>
            <SectionHeader label="Diagnostic vs. Operational Reality" />
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
              Does your diagnostic score match how you actually operate? Green = aligned. Yellow = diverging. Red = significant gap.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 32px' }}>
              <GapIndicator
                label="Governance"
                diagnostic={scores.governance}
                operational={surveyScores.gov}
              />
              <GapIndicator
                label="Audit Trail"
                diagnostic={scores.governance}
                operational={surveyScores.audit}
              />
              <GapIndicator
                label="Labor Division"
                diagnostic={scores.compression}
                operational={surveyScores.labor}
              />
              <GapIndicator
                label="Output Share"
                diagnostic={scores.compression}
                operational={surveyScores.output}
              />
            </div>
          </div>
        )}

        {/* Dimension Breakdown */}
        <div className="card-glass" style={{ padding: '28px', marginBottom: '20px', animation: 'fadeIn 600ms ease 500ms backwards' }}>
          <SectionHeader label="Dimension Breakdown" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {DIMENSION_KEYS.map(key => {
              const score = scores[key];
              const pct = ((score - 1) / 4) * 100;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {DIMENSION_LABELS[key]}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--signal)' }}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="dimension-bar-track">
                    <div className="dimension-bar-fill" style={{ width: barsVisible ? `${pct}%` : '0%' }} />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {DIMENSION_INTERPRETATIONS[key](score)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Survey summary */}
        {surveyAnswers.q18 || surveyAnswers.q19 ? (
          <div className="card-glass" style={{ padding: '28px', marginBottom: '20px', animation: 'fadeIn 600ms ease 600ms backwards' }}>
            <SectionHeader label="Field Notes" />
            {surveyAnswers.q18 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Worst failure
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  &ldquo;{surveyAnswers.q18}&rdquo;
                </p>
              </div>
            )}
            {surveyAnswers.q19 && (
              <div>
                <p style={{ fontSize: '11px', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Biggest unsolved problem
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  &ldquo;{surveyAnswers.q19}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* CTAs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
          animation: 'fadeIn 600ms ease 700ms backwards',
        }}>
          <a
            href="https://app.reclaim.ai/m/high/yalor-and-mikyo-hour"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              padding: '18px 20px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(124,110,191,0.06) 100%)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '10px',
              textDecoration: 'none',
              transition: 'all 200ms ease',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Join the Research →
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Book time with the CMPRSSN team
            </span>
          </a>

          <div
            onClick={handleShare}
            style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              padding: '18px 20px',
              background: 'rgba(14,26,46,0.5)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Share Results →
            </span>
            <span style={{ fontSize: '13px', color: shareMsg ? 'var(--signal)' : 'var(--text-tertiary)', lineHeight: 1.5, transition: 'color 200ms ease' }}>
              {shareMsg || 'Copy link with your full 22-question data'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            Built by Sedim3nt · CMPRSSN Q2 2026 Field Study
          </p>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)', boxShadow: 'var(--signal-glow)' }} />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--signal)', letterSpacing: '0.06em' }}>
          Loading...
        </div>
      </div>
    }>
      <ResultsInner />
    </Suspense>
  );
}
