import type { DailyMetrics } from '@/types';

const DEFAULT_URL = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'gemma:7b';

const GEMMA_API_URL = process.env.EXPO_PUBLIC_GEMMA_API_URL ?? DEFAULT_URL;
const GEMMA_MODEL = process.env.EXPO_PUBLIC_GEMMA_MODEL ?? DEFAULT_MODEL;

interface GemmaResponse {
  response?: string;
  error?: string;
}

const MAX_TIMEOUT_MS = 45_000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Gemma timed out. Is Ollama running?')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function queryGemma(prompt: string): Promise<string> {
  const res = await withTimeout(
    fetch(GEMMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GEMMA_MODEL, prompt, stream: false }),
    }),
    MAX_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(`Gemma request failed (${res.status}). Is Ollama running?`);
  }

  const data = (await res.json()) as GemmaResponse;
  if (data.error) throw new Error(data.error);
  const text = (data.response ?? '').trim();
  if (!text) throw new Error('Gemma returned an empty response.');
  return text;
}

export async function isGemmaAvailable(): Promise<boolean> {
  try {
    const res = await withTimeout(fetch(GEMMA_API_URL, { method: 'GET' }), 3000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function getHealthAdvice(metrics: DailyMetrics[]): Promise<string> {
  const latest = metrics[metrics.length - 1];
  const context =
    latest != null
      ? [
          `Date: ${latest.date}`,
          latest.heartRate != null ? `Resting heart rate: ${latest.heartRate} bpm` : null,
          latest.sleepHours != null ? `Sleep: ${latest.sleepHours} hours` : null,
          latest.stress != null ? `Stress: ${latest.stress}/10` : null,
          latest.weight != null ? `Weight: ${latest.weight} kg` : null,
          latest.recoveryScore != null ? `Recovery score: ${latest.recoveryScore}/100` : null,
        ]
          .filter((l): l is string => l != null)
          .join('\n')
      : 'No metrics logged yet.';

  return queryGemma(
    [
      'You are a health and wellness assistant embedded in a private, offline health tracker.',
      'Give practical, evidence-based lifestyle advice. Keep it under 150 words.',
      'Use "may", "might", and "consider" rather than absolute medical claims.',
      'If the data suggests something serious, recommend seeing a doctor.',
      '',
      'Today\'s data:',
      context,
      '',
      'Give concise health recommendations based on this data.',
    ].join('\n'),
  );
}

export async function explainBloodTest(testType: string, value: number, unit: string): Promise<string> {
  return queryGemma(
    [
      'You are a medical test explanation assistant. Explain what this lab value means.',
      'Keep it under 120 words and easy to understand.',
      'Mention that this is not a diagnosis and recommend consulting a doctor.',
      '',
      `Test: ${testType}`,
      `Value: ${value} ${unit}`,
      '',
      'Explain what this result means.',
    ].join('\n'),
  );
}
