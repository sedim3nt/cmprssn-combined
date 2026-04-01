const AIRTABLE_BASE = 'app5N0hqqzLb6iDoG';
const AIRTABLE_PAT = process.env.NEXT_PUBLIC_AIRTABLE_PAT || '';

async function airtablePost(table: string, fields: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('Airtable error:', err);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error('Airtable fetch failed:', e);
    return null;
  }
}

export async function saveCombinedToAirtable(data: {
  diagnosticScores: Record<string, number>;
  tier: string;
  overallScore: number;
  surveyAnswers: Record<string, string | string[]>;
  quadrant: string;
  omiScore: number;
}) {
  const sa = data.surveyAnswers;
  return airtablePost('Combined', {
    'Fleet Depth': data.diagnosticScores.fleetDepth,
    'Governance': data.diagnosticScores.governance,
    'Autonomy': data.diagnosticScores.autonomy,
    'Composability': data.diagnosticScores.composability,
    'Compression': data.diagnosticScores.compression,
    'Overall Score': data.overallScore,
    'Tier': data.tier,
    'OMI Score': data.omiScore,
    'Quadrant': data.quadrant,
    'Setup Type': sa.q1 || '',
    'Labor Division': sa.q2 || '',
    'Monthly Spend': sa.q8 || '',
    'Biggest Problem': sa.q11 || '',
    'Protocols Used': Array.isArray(sa.q10) ? sa.q10.join(', ') : (sa.q10 || ''),
    'Attribution': sa.q12 || '',
    'Submitted At': new Date().toISOString(),
  });
}
