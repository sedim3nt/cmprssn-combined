export interface SurveyAnswers {
  q11: string;
  q12: string;
  q13: string;
  q14: string;
  q15: string;
  q16: string;
  q17: string[]; // multi-select
  q18: string;   // open text
  q19: string;   // open text
  q20: string;
  q21: string;
  q22: string;
}

export const SURVEY_QUESTIONS = [
  {
    id: 11,
    dimension: "Setup Profile",
    question: "What best describes your agent setup?",
    type: "single" as const,
    options: [
      { value: "tools",    label: "I use AI tools",           sublabel: "ChatGPT, Claude, Copilot — task by task" },
      { value: "small",    label: "1–2 agents",               sublabel: "A small, mostly manual setup" },
      { value: "fleet",    label: "Multi-agent fleet",        sublabel: "Coordinated agents with defined roles" },
      { value: "native",   label: "Agent-native operator",    sublabel: "Agents are the primary execution layer" },
      { value: "building", label: "Building for others",      sublabel: "I design and deploy agent systems professionally" },
    ],
  },
  {
    id: 12,
    dimension: "Labor Division",
    question: "How do you and your agents divide labor?",
    type: "single" as const,
    options: [
      { value: "1", label: "I do most of the work", sublabel: "Agents handle minor tasks" },
      { value: "2", label: "Roughly 70/30 — I lead", sublabel: "Agents assist on specific steps" },
      { value: "3", label: "50/50 — genuine collaboration", sublabel: "Shared execution across tasks" },
      { value: "4", label: "Agents do most of the work", sublabel: "I review and direct" },
      { value: "5", label: "Not sure where I end", sublabel: "The boundary has dissolved" },
    ],
  },
  {
    id: 13,
    dimension: "Governance",
    question: "How do you govern what agents can do?",
    type: "single" as const,
    options: [
      { value: "1", label: "No governance at all",               sublabel: "Open permissions" },
      { value: "2", label: "Loose verbal instructions",          sublabel: "Informal guardrails" },
      { value: "3", label: "Written policy documents",           sublabel: "Documented but not enforced" },
      { value: "4", label: "Config files and scoped permissions", sublabel: "Enforced boundaries" },
      { value: "5", label: "Programmatic policy with kill switches", sublabel: "Policy-as-code" },
    ],
  },
  {
    id: 14,
    dimension: "Audit Trail",
    question: "What's your audit trail?",
    type: "single" as const,
    options: [
      { value: "1", label: "None",                                sublabel: "I don't track agent actions" },
      { value: "2", label: "I check outputs occasionally",       sublabel: "Spot review" },
      { value: "3", label: "Logs or git history",                sublabel: "Passive record" },
      { value: "4", label: "Structured logging",                 sublabel: "Active audit system" },
      { value: "5", label: "Real-time monitoring",               sublabel: "Alerts and observability" },
    ],
  },
  {
    id: 15,
    dimension: "Compute Spend",
    question: "What's your monthly AI compute spend?",
    type: "single" as const,
    options: [
      { value: "under20",   label: "Under $20",      sublabel: "Mostly free tier" },
      { value: "20-100",    label: "$20–$100",        sublabel: "Light usage" },
      { value: "100-500",   label: "$100–$500",       sublabel: "Regular operations" },
      { value: "500-2000",  label: "$500–$2,000",     sublabel: "Heavy operations" },
      { value: "over2000",  label: "Over $2,000",     sublabel: "Enterprise-scale" },
    ],
  },
  {
    id: 16,
    dimension: "Value Model",
    question: "How do you think about the unit of value?",
    type: "single" as const,
    options: [
      { value: "1", label: "Per token / per call",         sublabel: "Transactional mindset" },
      { value: "2", label: "Per task completed",           sublabel: "Deliverable-based" },
      { value: "3", label: "Per workflow automated",       sublabel: "System-level thinking" },
      { value: "4", label: "Per outcome, not activity",   sublabel: "Result-oriented" },
      { value: "5", label: "Haven't figured it out yet",  sublabel: "Still mapping the model" },
    ],
  },
  {
    id: 17,
    dimension: "Protocols",
    question: "What protocols do your agents use to communicate?",
    type: "multi" as const,
    options: [
      { value: "none",    label: "None" },
      { value: "fs",      label: "Filesystem" },
      { value: "mcp",     label: "MCP" },
      { value: "a2a",     label: "A2A" },
      { value: "custom",  label: "Custom protocol" },
      { value: "queue",   label: "Message queues" },
      { value: "api",     label: "Direct API calls" },
    ],
  },
  {
    id: 18,
    dimension: "Failure Story",
    question: "What's the worst agent failure you've experienced?",
    type: "text" as const,
    placeholder: "Describe what happened, what broke, and how you recovered (or didn't)...",
    maxLength: 500,
  },
  {
    id: 19,
    dimension: "Unsolved Problem",
    question: "What's your biggest unsolved problem with agents?",
    type: "text" as const,
    placeholder: "What keeps you up at night? What's the thing you can't crack yet?",
    maxLength: 500,
  },
  {
    id: 20,
    dimension: "Output Share",
    question: "What percentage of your organization's output comes from agent work?",
    type: "single" as const,
    options: [
      { value: "under10", label: "Under 10%",   sublabel: "Agents are peripheral" },
      { value: "10-30",   label: "10–30%",      sublabel: "Meaningful but secondary" },
      { value: "30-60",   label: "30–60%",      sublabel: "Agents carry real load" },
      { value: "60-80",   label: "60–80%",      sublabel: "Agents are primary" },
      { value: "80plus",  label: "80%+",         sublabel: "Almost everything" },
    ],
  },
  {
    id: 21,
    dimension: "Trajectory",
    question: "How has your agent setup changed in the last 3 months?",
    type: "single" as const,
    options: [
      { value: "started",    label: "Just started",               sublabel: "Brand new to this" },
      { value: "incremental",label: "Incremental improvements",   sublabel: "Steady iteration" },
      { value: "major",      label: "Major restructure",          sublabel: "Significant architectural changes" },
      { value: "transform",  label: "Complete transformation",    sublabel: "Fundamentally different now" },
      { value: "stable",     label: "Stable — not changing",      sublabel: "It's working, not touching it" },
    ],
  },
  {
    id: 22,
    dimension: "Attribution",
    question: "How would you like your responses attributed in the research?",
    type: "single" as const,
    options: [
      { value: "anon",    label: "Anonymous",      sublabel: "No identifying information" },
      { value: "context", label: "Context only",   sublabel: "Industry/role but not name" },
      { value: "named",   label: "Named",          sublabel: "You can use my name/org" },
    ],
  },
];

/**
 * Calculate Operational Maturity Index (0-100)
 * Combines diagnostic scores with survey context
 */
export function calculateOMI(
  diagnosticOverall: number,
  surveyAnswers: Partial<SurveyAnswers>
): number {
  // Base: diagnostic score normalized to 0-100 (40% weight)
  const diagnosticBase = ((diagnosticOverall - 1) / 4) * 100 * 0.4;

  // Governance depth (15% weight)
  const govScore = parseInt(surveyAnswers.q13 || '1');
  const govContrib = ((govScore - 1) / 4) * 100 * 0.15;

  // Audit depth (10% weight)
  const auditScore = parseInt(surveyAnswers.q14 || '1');
  const auditContrib = ((auditScore - 1) / 4) * 100 * 0.10;

  // Protocol sophistication (10% weight)
  const protocols = surveyAnswers.q17 || [];
  const protocolScore = protocols.includes('none') ? 0
    : Math.min(protocols.length / 4, 1);
  const protocolContrib = protocolScore * 100 * 0.10;

  // Output share (15% weight)
  const outputMap: Record<string, number> = {
    'under10': 1, '10-30': 2, '30-60': 3, '60-80': 4, '80plus': 5
  };
  const outputScore = outputMap[surveyAnswers.q20 || 'under10'] || 1;
  const outputContrib = ((outputScore - 1) / 4) * 100 * 0.15;

  // Labor division (10% weight)
  const laborScore = parseInt(surveyAnswers.q12 || '1');
  const laborContrib = ((laborScore - 1) / 4) * 100 * 0.10;

  const omi = diagnosticBase + govContrib + auditContrib + protocolContrib + outputContrib + laborContrib;
  return Math.min(100, Math.max(0, Math.round(omi)));
}

/**
 * Calculate 2x2 quadrant position (Autonomy vs Governance)
 */
export function calculateQuadrant(
  autonomyScore: number, // from diagnostic (1-5)
  surveyAnswers: Partial<SurveyAnswers>
): { quadrant: string; x: number; y: number } {
  const govScore = parseInt(surveyAnswers.q13 || '1');
  const auditScore = parseInt(surveyAnswers.q14 || '1');

  // Autonomy: from diagnostic q5+q6 (already averaged)
  const autonomyNorm = (autonomyScore - 1) / 4; // 0-1
  const governanceNorm = ((govScore + auditScore) / 2 - 1) / 4; // 0-1

  const quadrant =
    autonomyNorm >= 0.5 && governanceNorm >= 0.5 ? "Sovereign" :
    autonomyNorm >= 0.5 && governanceNorm < 0.5  ? "Rogue"     :
    autonomyNorm < 0.5  && governanceNorm >= 0.5 ? "Supervised":
                                                    "Observer";

  return { quadrant, x: autonomyNorm, y: governanceNorm };
}

/**
 * Generate Composition DNA — a deterministic hex pattern from all 22 answers
 */
export function generateDNA(
  diagnosticAnswers: Record<string, number>,
  surveyAnswers: Partial<SurveyAnswers>
): string {
  const vals: number[] = [];
  for (let i = 1; i <= 10; i++) {
    vals.push((diagnosticAnswers[`q${i}`] || 1) - 1); // 0-4
  }
  // Survey single-select questions
  const singleMap: Record<string, string[]> = {
    q11: ['tools','small','fleet','native','building'],
    q12: ['1','2','3','4','5'],
    q13: ['1','2','3','4','5'],
    q14: ['1','2','3','4','5'],
    q15: ['under20','20-100','100-500','500-2000','over2000'],
    q16: ['1','2','3','4','5'],
    q20: ['under10','10-30','30-60','60-80','80plus'],
    q21: ['started','incremental','major','transform','stable'],
    q22: ['anon','context','named'],
  };
  for (const [key, options] of Object.entries(singleMap)) {
    const val = (surveyAnswers as Record<string, unknown>)[key] as string || '';
    vals.push(options.indexOf(val) + 1);
  }
  // Multi-select q17
  const protocols = surveyAnswers.q17 || [];
  const protoOptions = ['none','fs','mcp','a2a','custom','queue','api'];
  let protoBits = 0;
  protoOptions.forEach((p, i) => { if (protocols.includes(p)) protoBits |= (1 << i); });
  vals.push(protoBits % 16); // 0-15

  return vals.map(v => v.toString(16).toUpperCase()).join('');
}

export function encodeSurveyAnswers(answers: Partial<SurveyAnswers>): string {
  const params = new URLSearchParams();
  Object.entries(answers).forEach(([key, val]) => {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        params.set(key, val.join(','));
      } else {
        params.set(key, String(val));
      }
    }
  });
  return params.toString();
}

export function decodeSurveyAnswers(search: string): Partial<SurveyAnswers> {
  const params = new URLSearchParams(search);
  const answers: Partial<SurveyAnswers> = {};
  const multiKeys = ['q17'];
  const keys = ['q11','q12','q13','q14','q15','q16','q17','q18','q19','q20','q21','q22'] as (keyof SurveyAnswers)[];
  keys.forEach(key => {
    const val = params.get(key);
    if (val) {
      if (multiKeys.includes(key)) {
        (answers as Record<string, string[]>)[key] = val.split(',').filter(Boolean);
      } else {
        (answers as Record<string, string>)[key] = val;
      }
    }
  });
  return answers;
}
