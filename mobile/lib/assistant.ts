import type { SupabaseClient } from '@supabase/supabase-js';
import { checkEligibility, isDeadlineOpen } from './core';
import type { AppProfile, ScholarshipRow } from './data/types';
import { formatINR } from './format';

/**
 * DEMO ASSISTANT: keyword matching over the records already loaded in the app. It is NOT an AI model.
 * It reuses the deterministic engine for eligibility, so it never invents a verdict.
 */
export function demoAnswer(question: string, scholarships: ScholarshipRow[], profile: AppProfile | null): string {
  const q = question.trim().toLowerCase();
  if (!q) return 'Type a question first, for example: "Which scholarships am I eligible for?"';
  if (scholarships.length === 0) return 'There are no open scholarship records to answer from right now.';
  const strip = (t: string) => t.toLowerCase().replace(/^\[demo\]\s*/, '');
  const verdict = (s: ScholarshipRow) => (profile ? checkEligibility(profile, s).result : 'Unknown');

  const named = scholarships.find((s) => q.includes(strip(s.title)));
  if (named) {
    const lines = [
      `${named.title} (${named.provider ?? 'provider not listed'})`,
      `Award: ${formatINR(named.amount)}. Deadline: ${named.deadline ?? 'not listed'}.`,
      named.income_limit != null ? `Income limit: ${formatINR(named.income_limit)} per year.` : '',
      named.minimum_percentage != null ? `Minimum marks: ${named.minimum_percentage}%.` : '',
      named.required_documents?.length ? `Documents: ${named.required_documents.join(', ')}.` : '',
      profile ? `For your saved profile the rules engine says: ${verdict(named)}.` : '',
    ];
    return lines.filter(Boolean).join('\n');
  }
  if (/eligible|qualify|match|suit|for me/.test(q)) {
    const rows = scholarships.filter((s) => isDeadlineOpen(s.deadline)).map((s) => `• ${s.title}: ${verdict(s)}`);
    return `Based on your saved profile (checked by the rules engine):\n${rows.join('\n')}\nIncomplete profiles show "Potentially Eligible".`;
  }
  if (/deadline|last date|closing|due/.test(q)) {
    return scholarships.map((s) => `• ${s.title}: ${s.deadline ?? 'not listed'}`).join('\n');
  }
  if (/document|certificate|papers/.test(q)) {
    return scholarships.map((s) => `• ${s.title}: ${s.required_documents?.length ? s.required_documents.join(', ') : 'none listed'}`).join('\n');
  }
  if (/girl|women|woman|female/.test(q)) {
    const rows = scholarships.filter((s) => (s.gender_requirement ?? '').toLowerCase() === 'female');
    return rows.length ? rows.map((s) => `• ${s.title}: ${formatINR(s.amount)}`).join('\n') : 'No listing in the current records is restricted to women.';
  }
  if (/(which|what|list|show).*(scholarship|grant|fellowship)|available/.test(q)) {
    return scholarships.map((s) => `• ${s.title}: ${formatINR(s.amount)}, deadline ${s.deadline ?? 'not listed'}`).join('\n');
  }
  return 'I can only match keywords in the records loaded in this app. Try: "which scholarships am I eligible for", "deadlines", "documents", or a scholarship name.';
}

/** Calls the `assistant` Supabase Edge Function. The provider key lives only in Supabase secrets. */
export async function askServerAssistant(client: SupabaseClient, question: string): Promise<string> {
  const { data, error } = await client.functions.invoke('assistant', { body: { question: question.slice(0, 1000) } });
  if (error) throw new Error('The AI assistant is not available right now. Ask the app owner to check the Edge Function deployment.');
  const answer = (data as { answer?: string } | null)?.answer;
  if (!answer) throw new Error('The assistant returned an empty answer.');
  return answer;
}
