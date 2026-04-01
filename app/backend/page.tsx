'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { getAllResponses, type CombinedResponse } from '@/lib/supabase';
import { generateDNA } from '@/lib/survey';

const PASSWORD = 'cmprssn2026';

function DNAMini({ dna }: { dna: string }) {
  const cells = Array.from({ length: 16 }, (_, i) => {
    const hexChar = dna[i % dna.length] || '0';
    return parseInt(hexChar, 16) / 15;
  });
  const cols = 8;
  const rows = 2;
  const w = 80;
  const h = 20;
  const cw = w / cols;
  const ch = h / rows;
  return (
    <svg width={w} height={h}>
      {cells.map((val, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const opacity = 0.2 + val * 0.7;
        return (
          <rect key={i} x={col * cw + 0.5} y={row * ch + 0.5} width={cw - 1} height={ch - 1} rx={1}
            fill={`rgba(139,92,246,${opacity})`} />
        );
      })}
    </svg>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' }} />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

export default function BackendPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const [responses, setResponses] = useState<CombinedResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (pw === PASSWORD) {
      setAuthed(true);
    } else {
      setPwErr(true);
      setTimeout(() => setPwErr(false), 2000);
    }
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    getAllResponses().then(data => {
      setResponses(data);
      setLoading(false);
    });
  }, [authed]);

  // Scatter: diagnostic score (x) vs OMI (y)
  const scatterData = useMemo(() =>
    responses.map(r => ({
      x: parseFloat(String((r.diagnostic_scores as Record<string, number>).overall || 0)).toFixed(2),
      y: r.omi_score,
      quadrant: r.quadrant,
    })),
    [responses]
  );

  // Avg radar
  const avgRadar = useMemo(() => {
    if (!responses.length) return [];
    const dims = ['fleetDepth', 'governance', 'autonomy', 'composability', 'compression'];
    const labels = ['Fleet Depth', 'Governance', 'Autonomy', 'Composability', 'Compression'];
    return dims.map((d, i) => {
      const avg = responses.reduce((sum, r) => sum + ((r.diagnostic_scores as Record<string, number>)[d] || 0), 0) / responses.length;
      return { dimension: labels[i], score: parseFloat(avg.toFixed(2)), fullMark: 5 };
    });
  }, [responses]);

  // Gap analysis: avg diagnostic score vs avg survey-based
  const gapData = useMemo(() => {
    if (!responses.length) return [];
    const avgDiag = responses.reduce((sum, r) => sum + ((r.diagnostic_scores as Record<string, number>).overall || 0), 0) / responses.length;
    const avgOMI = responses.reduce((sum, r) => sum + (r.omi_score || 0), 0) / responses.length;
    return [
      { label: 'Diagnostic', value: ((avgDiag - 1) / 4) * 100 },
      { label: 'Op. Maturity', value: avgOMI },
    ];
  }, [responses]);

  // CSV export
  const handleCSV = () => {
    const headers = ['id','created_at','omi_score','quadrant','diagnostic_overall','diagnostic_fleetDepth','diagnostic_governance','diagnostic_autonomy','diagnostic_composability','diagnostic_compression'];
    const rows = responses.map(r => {
      const ds = r.diagnostic_scores as Record<string, number>;
      return [
        r.id || '',
        r.created_at || '',
        r.omi_score,
        r.quadrant,
        ds.overall || '',
        ds.fleetDepth || '',
        ds.governance || '',
        ds.autonomy || '',
        ds.composability || '',
        ds.compression || '',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cmprssn-combined-responses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── AUTH ── */
  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '360px', width: '100%', animation: 'fadeIn 500ms ease' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            CMPRSSN · Backend Access
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--frost)', marginBottom: '24px' }}>
            Research Results
          </h1>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Access password"
            style={{
              width: '100%',
              background: 'rgba(14,26,46,0.6)',
              border: `1px solid ${pwErr ? '#F87171' : 'var(--border-default)'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--frost)',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              outline: 'none',
              marginBottom: '12px',
              transition: 'border-color 200ms ease',
            }}
          />
          {pwErr && <p style={{ fontSize: '13px', color: '#F87171', marginBottom: '12px' }}>Incorrect password</p>}
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: '8px',
              color: 'var(--frost)',
              fontFamily: 'var(--font-display)',
              fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Enter →
          </button>
        </div>
      </main>
    );
  }

  /* ── DASHBOARD ── */
  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(24px, 4vw, 48px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              CMPRSSN Research Backend
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: 'var(--frost)' }}>
              Field Study Results
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '6px',
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              color: 'var(--signal)',
            }}>
              {loading ? '...' : responses.length}
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '6px' }}>responses</span>
            </div>
            <button onClick={handleCSV} style={{
              padding: '8px 16px',
              background: 'rgba(14,26,46,0.6)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
              Export CSV →
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
            Loading responses...
          </div>
        ) : (
          <>
            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* Scatter: Diagnostic vs OMI */}
              <div className="card-glass" style={{ padding: '24px' }}>
                <SectionHeader label="Diagnostic Score vs Operational Maturity Index" />
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid stroke="rgba(139,92,246,0.08)" strokeDasharray="4 4" />
                      <XAxis
                        type="number" dataKey="x" name="Diagnostic" domain={[1, 5]}
                        tick={{ fill: 'rgba(240,232,244,0.4)', fontSize: 10, fontFamily: 'Rajdhani' }}
                        label={{ value: 'Diagnostic Score', position: 'insideBottom', offset: -2, fill: 'rgba(240,232,244,0.3)', fontSize: 10 }}
                      />
                      <YAxis
                        type="number" dataKey="y" name="OMI" domain={[0, 100]}
                        tick={{ fill: 'rgba(240,232,244,0.4)', fontSize: 10, fontFamily: 'Rajdhani' }}
                        label={{ value: 'OMI', angle: -90, position: 'insideLeft', fill: 'rgba(240,232,244,0.3)', fontSize: 10 }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: 'rgba(139,92,246,0.3)' }}
                        contentStyle={{
                          background: 'rgba(14,26,46,0.95)',
                          border: '1px solid rgba(139,92,246,0.2)',
                          borderRadius: '6px',
                          color: '#F0E8F4', fontSize: '12px', fontFamily: 'Rajdhani',
                        }}
                        formatter={(val, name) => [val, name === 'x' ? 'Diagnostic' : 'OMI']}
                      />
                      <Scatter
                        data={scatterData}
                        fill="#8B5CF6"
                        fillOpacity={0.7}
                        r={5}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Average Radar */}
              <div className="card-glass" style={{ padding: '24px' }}>
                <SectionHeader label="Average Diagnostic Scores (All Respondents)" />
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={avgRadar} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                      <PolarGrid stroke="rgba(139,92,246,0.1)" strokeDasharray="4 4" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: 'rgba(240,232,244,0.45)', fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 600 }}
                      />
                      <Radar
                        dataKey="score"
                        stroke="#8B5CF6" strokeWidth={2}
                        fill="rgba(139,92,246,0.15)" fillOpacity={1}
                        dot={{ fill: '#8B5CF6', r: 3 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(14,26,46,0.95)',
                          border: '1px solid rgba(139,92,246,0.2)',
                          borderRadius: '6px',
                          color: '#F0E8F4', fontSize: '12px',
                        }}
                        formatter={(val) => [typeof val === 'number' ? val.toFixed(2) : val, 'Avg Score']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gap Analysis */}
              <div className="card-glass" style={{ padding: '24px' }}>
                <SectionHeader label="Self-Assessment vs Operational Maturity Gap" />
                <div style={{ padding: '16px 0' }}>
                  {gapData.map(d => (
                    <div key={d.label} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>{d.label}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--signal)' }}>{Math.round(d.value)}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(139,92,246,0.1)', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${d.value}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '3px', transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                  {responses.length > 0 && (
                    <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(139,92,246,0.06)', borderRadius: '6px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {gapData[0]?.value > gapData[1]?.value
                          ? `Respondents self-assess ${(gapData[0].value - gapData[1].value).toFixed(0)} pts higher than their operational maturity suggests.`
                          : `Operational maturity aligns with or exceeds diagnostic self-assessment.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* DNA Gallery */}
              <div className="card-glass" style={{ padding: '24px' }}>
                <SectionHeader label="Composition DNA Gallery" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {responses.slice(0, 40).map((r, i) => {
                    const dna = generateDNA(
                      r.diagnostic_answers as Record<string, number>,
                      r.survey_answers as Record<string, string>
                    );
                    return (
                      <div key={i} title={`${r.quadrant} · OMI: ${r.omi_score}`}>
                        <DNAMini dna={dna} />
                      </div>
                    );
                  })}
                  {responses.length === 0 && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No responses yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Response table */}
            <div className="card-glass" style={{ padding: '24px', overflow: 'auto' }}>
              <SectionHeader label="All Responses" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['Date', 'Diagnostic', 'OMI', 'Quadrant', 'DNA'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '8px 12px',
                        fontFamily: 'var(--font-display)', fontSize: '10px',
                        color: 'var(--text-tertiary)', letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => {
                    const ds = r.diagnostic_scores as Record<string, number>;
                    const dna = generateDNA(
                      r.diagnostic_answers as Record<string, number>,
                      r.survey_answers as Record<string, string>
                    );
                    const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : '—';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 150ms ease' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px', color: 'var(--text-tertiary)' }}>{date}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '15px' }}>
                          {(ds.overall || 0).toFixed(1)}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#A78BFA', fontFamily: 'var(--font-display)', fontSize: '15px' }}>
                          {r.omi_score}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            background: 'rgba(139,92,246,0.1)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px',
                            color: 'var(--signal)',
                          }}>
                            {r.quadrant}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <DNAMini dna={dna} />
                        </td>
                      </tr>
                    );
                  })}
                  {responses.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No responses yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
