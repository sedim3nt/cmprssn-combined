import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iwqsfojnlpovynuzpeiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cXNmb2pubHBvdnludXpwZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjA2ODEsImV4cCI6MjA5MDIzNjY4MX0.7KX5LurSZsZHuahFVRRLPHqSgYxC7B-oQLg2e_bqRsI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface CombinedResponse {
  id?: string;
  diagnostic_answers: Record<string, number>;
  survey_answers: Record<string, unknown>;
  diagnostic_scores: Record<string, number>;
  omi_score: number;
  quadrant: string;
  created_at?: string;
}

export async function saveResponse(data: CombinedResponse) {
  const { data: result, error } = await supabase
    .from('cmprssn_combined')
    .insert([{
      diagnostic_answers: data.diagnostic_answers,
      survey_answers: data.survey_answers,
      diagnostic_scores: data.diagnostic_scores,
      omi_score: data.omi_score,
      quadrant: data.quadrant,
    }])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return null;
  }
  return result;
}

export async function getAllResponses(): Promise<CombinedResponse[]> {
  const { data, error } = await supabase
    .from('cmprssn_combined')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch error:', error);
    return [];
  }
  return data || [];
}
