import type { DiagnosticAnswers } from './diagnostic';
import type { SurveyAnswers } from './survey';

export function encodeAll(
  diagnostic: Partial<DiagnosticAnswers>,
  survey: Partial<SurveyAnswers>
): string {
  const params = new URLSearchParams();
  // Diagnostic
  Object.entries(diagnostic).forEach(([k, v]) => {
    if (v !== undefined) params.set(k, String(v));
  });
  // Survey
  Object.entries(survey).forEach(([k, v]) => {
    if (v !== undefined) {
      if (Array.isArray(v)) {
        params.set(k, v.join(','));
      } else {
        params.set(k, String(v));
      }
    }
  });
  return params.toString();
}

export function decodeAll(search: string): {
  diagnostic: Partial<DiagnosticAnswers>;
  survey: Partial<SurveyAnswers>;
} {
  const params = new URLSearchParams(search);
  const diagnostic: Partial<DiagnosticAnswers> = {};
  const survey: Partial<SurveyAnswers> = {};

  const dKeys = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'];
  const sMulti = ['q17'];

  params.forEach((val, key) => {
    if (dKeys.includes(key)) {
      const num = parseInt(val);
      if (num >= 1 && num <= 5) {
        (diagnostic as Record<string, number>)[key] = num;
      }
    } else if (key.startsWith('q')) {
      if (sMulti.includes(key)) {
        (survey as Record<string, string[]>)[key] = val.split(',').filter(Boolean);
      } else {
        (survey as Record<string, string>)[key] = val;
      }
    }
  });

  return { diagnostic, survey };
}
