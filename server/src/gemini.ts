import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SUGGESTION_BUCKETS } from './prompts';
import { ENV } from './env';

export const genAI = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);

// Default model configuration
const DEFAULT_MODEL = "gemini-1.5-flash-latest";

const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.9,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 450,
  candidateCount: 2,
  stopSequences: [],
};

const DEFAULT_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Utility functions for response scoring
function similarityScore(text1: string | undefined | null, text2: string | undefined | null): number {
  if (!text1 || !text2) return 0;
  
  const getNGrams = (text: string, n: number) => {
    const ngrams = new Set<string>();
    for (let i = 0; i < text.length - n + 1; i++) {
      ngrams.add(text.slice(i, i + n).toLowerCase());
    }
    return ngrams;
  };

  const ngrams1 = getNGrams(text1, 3);
  const ngrams2 = getNGrams(text2, 3);
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);
  
  return intersection.size / union.size;
}

function hasEmpathicReflection(text: string): boolean {
  const reflectionPhrases = [
    'sounds like',
    'i hear',
    'it seems',
    'you feel',
    'you\'re feeling',
    'that must be',
    'i can sense',
    'i understand',
  ];
  return reflectionPhrases.some(phrase => text.toLowerCase().includes(phrase));
}

function countQuestions(text: string): number {
  return (text.match(/\?/g) || []).length;
}

interface ResponseCandidate {
  message: string;
  follow_up_question?: string;
  suggestion: {
    title: string;
    steps: string[];
  };
}

function scoreCandidate(
  candidate: ResponseCandidate,
  history: {
    assistantLast5: Array<{ text: string }>;
    assistantOpenersLast10: string[];
    assistantQuestionsLast5: string[];
  }
): number {
  let score = 0;

  // Check similarity with recent messages
  const maxSimilarity = Math.max(
    ...history.assistantLast5.map(m => similarityScore(candidate.message, m.text))
  );
  const simPenalty = maxSimilarity > 0.92 ? 3 : maxSimilarity * 2;

  // Check for repeated openings
  const opening = candidate.message.split('.')[0] || '';
  const repeatsOpening = history.assistantOpenersLast10.some(
    o => similarityScore(opening, o) > 0.8
  );

  // Check for repeated questions
  const repeatsQuestion = candidate.follow_up_question && 
    history.assistantQuestionsLast5.some(
      q => similarityScore(candidate.follow_up_question, q) > 0.8
    );

  // Build score
  score += hasEmpathicReflection(candidate.message) ? 2 : 0;
  score += candidate.suggestion?.steps?.length > 0 ? 2 : 0;
  score += candidate.follow_up_question ? 1 : 1.5; // Small bonus for no question
  score -= simPenalty;
  if (repeatsOpening) score -= 3;
  if (repeatsQuestion) score -= 3;
  if (countQuestions(candidate.message) > 1) score -= 2;

  return score;
}

// Safe JSON parsing
function safeParse(text: string | undefined | null): ResponseCandidate | null {
  if (!text) return null;
  
  try {
    // Remove code fences if present
    const cleaned = text.replace(/^\`\`\`json\n|\`\`\`$/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    // Validate required fields
    if (
      typeof parsed.message !== 'string' ||
      !parsed.suggestion ||
      typeof parsed.suggestion.title !== 'string' ||
      !Array.isArray(parsed.suggestion.steps)
    ) {
      return null;
    }
    
    return parsed as ResponseCandidate;
  } catch (e) {
    console.error('Failed to parse response:', e);
    return null;
  }
}

export interface GenerateOpts {
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
  safetySettings?: any[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateWithRetry(
  prompt: string,
  context: any,
  opts: GenerateOpts = {},
  maxRetries = 3
): Promise<ResponseCandidate | null> {
  const model = genAI.getGenerativeModel({
    model: opts.model ?? DEFAULT_MODEL,
  });

  const generationConfig = {
    ...DEFAULT_GENERATION_CONFIG,
    temperature: opts.temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
    topP: opts.topP ?? DEFAULT_GENERATION_CONFIG.topP,
    topK: opts.topK ?? DEFAULT_GENERATION_CONFIG.topK,
    maxOutputTokens: opts.maxTokens ?? DEFAULT_GENERATION_CONFIG.maxOutputTokens,
    candidateCount: opts.candidateCount ?? DEFAULT_GENERATION_CONFIG.candidateCount,
    stopSequences: opts.stopSequences ?? DEFAULT_GENERATION_CONFIG.stopSequences,
  };

  let attempt = 0;
  const base = 1000; // base backoff

  for (;;) {
    try {
      console.log(`Generation attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const response = await model.generateContent({
        contents: [
          { role: "system", parts: [{ text: prompt }] },
          { role: "user", parts: [{ text: JSON.stringify(context) }] }
        ],
        generationConfig,
        safetySettings: opts.safetySettings ?? DEFAULT_SAFETY_SETTINGS,
      });

      const candidates = response.response?.candidates ?? [];
      const scored = candidates
        .map(c => safeParse(c.content?.parts?.[0]?.text))
        .filter((x): x is ResponseCandidate => x !== null)
        .map(x => ({
          content: x,
          score: scoreCandidate(x, context.history)
        }))
        .sort((a, b) => b.score - a.score);

      let best = scored[0]?.content;
      
      // If no good candidates, try one regeneration
      if (!best || scored[0].score < 0) {
        if (attempt < maxRetries) {
          attempt++;
          await sleep(base * 2 ** attempt);
          continue;
        }
        throw new Error('Failed to generate satisfactory response');
      }

      return best;

    } catch (e: any) {
      console.error(`Generation attempt ${attempt + 1} failed:`, e.message);
      
      const status = e?.status || e?.code;
      const retryInfo = e?.errorDetails?.find((d: any) => d?.["@type"]?.includes("RetryInfo"))?.retryDelay;
      const isRetryable =
        status === 429 ||
        status === 503 ||
        status === "ECONNRESET" ||
        status === "ETIMEDOUT" ||
        status === "EAI_AGAIN" ||
        (e instanceof Error && e.message?.includes("timed out"));

      if (isRetryable && attempt < maxRetries) {
        const serverDelay = parseRetryDelay(retryInfo);
        const jitter = Math.floor(Math.random() * 250);
        const backoff = serverDelay ?? Math.min(base * 2 ** attempt, 10_000) + jitter;
        console.log(`Retrying in ${backoff}ms...`);
        attempt++;
        await sleep(backoff);
        continue;
      }
      
      throw e;
    }
  }
}

function parseRetryDelay(retryInfo: any): number | null {
  try {
    if (typeof retryInfo === 'string') {
      const match = retryInfo.match(/PT([\d.]+)S/);
      if (match) {
        return Math.ceil(parseFloat(match[1]) * 1000);
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export type { ResponseCandidate };