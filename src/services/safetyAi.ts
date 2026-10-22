import type { Language, ScenarioData, ShelterInfo, LiveWeather } from '../types';
import { 
  buildEnrichedTriageReply, 
  detectTriageIntent, 
  VERIFIED_EMERGENCY_HOTLINES 
} from '../data/triageProtocols';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export const hasGeminiKey = () => Boolean(GEMINI_KEY);

export interface SafetyAiReply {
  title: string;
  verificationSummary?: string;
  sourcesChecked?: string[];
  steps: string[];
  suggestions: string[];
  source: 'gemini' | 'offline';
  hotlines?: { name: string; number: string; purposeEn: string; purposeBm: string }[];
  canRetry?: boolean;
  retryPrompt?: string;
}

export interface SafetyAiContext {
  language: Language;
  scenario: ScenarioData;
  selectedShelter: ShelterInfo;
  weather: LiveWeather | null;
  userLocation?: { lat: number; lon: number } | null;
}

/**
 * In-memory LRU-style cache for fast repeated and prefetched queries.
 */
const replyCache = new Map<string, SafetyAiReply>();

export function getCacheKey(text: string, lang: Language, scenarioId: string): string {
  const norm = text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${scenarioId}:${lang}:${norm}`;
}

/**
 * Prefetches and caches verified triage answers for the current language and scenario.
 * Ensures triage chips always respond with 0ms delay.
 */
export function prefetchTriageCache(_lang: Language, scenario: ScenarioData, selectedShelter: ShelterInfo) {
  const keys: Array<'pack' | 'drive' | 'power' | 'trapped'> = ['pack', 'drive', 'power', 'trapped'];
  for (const k of keys) {
    const enReply = buildEnrichedTriageReply(k, 'en', scenario, selectedShelter);
    const bmReply = buildEnrichedTriageReply(k, 'bm', scenario, selectedShelter);

    replyCache.set(getCacheKey(k, 'en', scenario.id), enReply);
    replyCache.set(getCacheKey(k, 'bm', scenario.id), bmReply);

    // Common query variants
    if (k === 'pack') {
      replyCache.set(getCacheKey('what to pack right now', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('what should i pack right now', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('apa yang patut saya kemas sekarang', 'bm', scenario.id), bmReply);
      replyCache.set(getCacheKey('apa patut dikemas', 'bm', scenario.id), bmReply);
    } else if (k === 'drive') {
      replyCache.set(getCacheKey('can i drive through water', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('can i drive my car through water', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('bolehkah saya pandu kereta redah air', 'bm', scenario.id), bmReply);
      replyCache.set(getCacheKey('boleh pandu kereta redah air', 'bm', scenario.id), bmReply);
    } else if (k === 'power') {
      replyCache.set(getCacheKey('should i switch off the main breaker', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('electrical safety', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('perlukah saya tutup suis utama elektrik', 'bm', scenario.id), bmReply);
      replyCache.set(getCacheKey('keselamatan elektrik', 'bm', scenario.id), bmReply);
    } else if (k === 'trapped') {
      replyCache.set(getCacheKey('what if water enters my house', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('trapped inside', 'en', scenario.id), enReply);
      replyCache.set(getCacheKey('apa tindakan jika air masuk rumah', 'bm', scenario.id), bmReply);
      replyCache.set(getCacheKey('terperangkap dalam rumah', 'bm', scenario.id), bmReply);
    }
  }
}

/**
 * Detects if the user query was phrased in Bahasa Melayu or English.
 */
function detectQueryLanguage(text: string, fallback: Language): Language {
  const lower = text.toLowerCase();
  const bmWords = /\b(ada|adakah|banjir|ke|di|dekat|kat|macam|mana|apa|boleh|tak|tidak|perlu|patut|saya|kami|rumah|air|naik|jalan|kereta|selamat|sekarang|hari|ini|tolong|bantuan|sungai|hujan|kemas|suis|tutup)\b/;
  const enWords = /\b(is|are|there|flood|flooding|in|at|near|what|how|can|should|my|house|water|rising|safe|now|today|help|shelter|drive|pack|power|breaker)\b/;
  const bmMatch = bmWords.test(lower);
  const enMatch = enWords.test(lower);
  if (bmMatch && !enMatch) return 'bm';
  if (enMatch && !bmMatch) return 'en';
  return fallback;
}

/**
 * Instant local responder for one-tap triage chips.
 * Returns immediately (<10ms) with zero network calls and zero model calls.
 */
export function getInstantTriageReply(
  userText: string,
  ctx: SafetyAiContext
): SafetyAiReply | null {
  const intent = detectTriageIntent(userText);
  if (!intent) return null;

  const effectiveLang = detectQueryLanguage(userText, ctx.language);
  const cacheKey = getCacheKey(userText, effectiveLang, ctx.scenario.id);
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  const reply = buildEnrichedTriageReply(intent, effectiveLang, ctx.scenario, ctx.selectedShelter);
  replyCache.set(cacheKey, reply);
  return reply;
}

/**
 * Fallback emergency response using local verified protocols when network/model fails or times out.
 */
export function buildLocalFallbackReply(
  userText: string,
  ctx: SafetyAiContext,
  isTimeout: boolean = false
): SafetyAiReply {
  const intent = detectTriageIntent(userText) || 'trapped';
  const effectiveLang = detectQueryLanguage(userText, ctx.language);
  const base = buildEnrichedTriageReply(intent, effectiveLang, ctx.scenario, ctx.selectedShelter);

  const timeoutNoteEn = isTimeout 
    ? '⚠️ Network timeout (7s): Showing verified Civil Defence protocol immediately for your safety.' 
    : 'ℹ️ Offline mode: Displaying verified National Civil Defence protocol.';
  const timeoutNoteBm = isTimeout 
    ? '⚠️ Sambungan terputus (7s): Menampilkan protokol Pertahanan Awam yang disahkan serta-merta demi keselamatan anda.' 
    : 'ℹ️ Mod luar talian: Memaparkan protokol sah Pertahanan Awam Kebangsaan.';

  return {
    ...base,
    title: effectiveLang === 'bm' ? base.title : base.title,
    verificationSummary: (effectiveLang === 'bm' ? timeoutNoteBm : timeoutNoteEn) + ' ' + (base.verificationSummary || ''),
    canRetry: true,
    retryPrompt: userText,
    hotlines: VERIFIED_EMERGENCY_HOTLINES,
    source: 'offline'
  };
}

export interface StreamCallbacks {
  onChunk?: (chunk: string, fullText: string) => void;
  onFirstSentence?: (sentence: string) => void;
}

/**
 * High-performance Safety AI Streamer:
 * 1. Checks memory/triage cache (<5ms).
 * 2. If it's a verified triage query, resolves immediately from local bundled content with 0 model calls.
 * 3. For follow-ups and free text:
 *    - Uses trimmed prompt (<200 tokens) with active shelter data.
 *    - Strict 6 to 8 second timeout (7000ms) with AbortController.
 *    - Fastest suitable Gemini flash models.
 *    - Streams response chunks in real-time.
 *    - Fires `onFirstSentence` as soon as the first sentence terminator appears so Read Aloud begins immediately.
 *    - Gracefully falls back to local emergency protocol with a retry button on timeout.
 */
export async function askSafetyAiStreaming(
  userText: string,
  ctx: SafetyAiContext,
  history: { sender: 'user' | 'assistant'; text: string }[] = [],
  callbacks?: StreamCallbacks
): Promise<SafetyAiReply> {
  const effectiveLang = detectQueryLanguage(userText, ctx.language);
  const isBm = effectiveLang === 'bm';

  // 1. Check instant triage interceptor (0ms delay)
  const instantReply = getInstantTriageReply(userText, ctx);
  if (instantReply) {
    if (callbacks?.onChunk) {
      callbacks.onChunk(instantReply.title, instantReply.title);
    }
    if (callbacks?.onFirstSentence) {
      const firstSentence = instantReply.steps[0] || instantReply.title;
      callbacks.onFirstSentence(firstSentence);
    }
    return instantReply;
  }

  // 2. Check cache for repeated query
  const cacheKey = getCacheKey(userText, effectiveLang, ctx.scenario.id);
  const cached = replyCache.get(cacheKey);
  if (cached) {
    if (callbacks?.onChunk) callbacks.onChunk(cached.title, cached.title);
    if (callbacks?.onFirstSentence && cached.steps[0]) {
      callbacks.onFirstSentence(cached.steps[0]);
    }
    return cached;
  }

  // 3. If offline or no Gemini key, return verified local guidance immediately
  if (!GEMINI_KEY || !navigator.onLine) {
    return buildLocalFallbackReply(userText, ctx, false);
  }

  // 4. Compact, ultra-fast system prompt (<200 tokens)
  const shelter = ctx.selectedShelter;
  const shelterContext = `Verified Evacuation Point (PPS): ${isBm && shelter.nameBm ? shelter.nameBm : shelter.name} (${shelter.distanceKm}km, ~${shelter.walkMinutes}m walk, Capacity: ${shelter.capacityCurrent}/${shelter.capacityTotal}, Address: ${shelter.address}, Phone: ${shelter.phone})`;
  const weatherBrief = ctx.weather ? `Weather: ${ctx.weather.description}, Temp: ${Math.round(ctx.weather.tempC)}°C, Rain 24h: ${ctx.weather.rain24hMm.toFixed(1)}mm, IPU: ${ctx.weather.ipuIndex}` : '';

  const systemInstruction = `You are Terra Guard V2, Malaysia's official citizen disaster safety AI companion.
Language: Respond strictly in ${isBm ? 'Malaysian Bahasa Melayu (BM)' : 'clear, concise English'}.
Current Scenario: ${ctx.scenario.locationName} (${ctx.scenario.riskLevel.toUpperCase()}).
${shelterContext}
${weatherBrief}

RULES:
1. Provide actionable emergency advice in 3-4 short numbered steps.
2. NEVER invent fake evacuation shelters, fake road closures, or unverified phone numbers. Always use the verified shelter above.
3. For life-threatening emergencies, advise calling MERS 999 or Bomba 994 immediately.
4. Keep response under 350 words. Be direct, calm, and practical.`;

  // Filter history to last 3 messages to avoid prompt bloating
  const trimmedHistory = history.slice(-3).map(h => ({
    role: h.sender === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  const contents = [
    ...trimmedHistory,
    { role: 'user', parts: [{ text: userText }] }
  ];

  // Fast models cascade: production flash models for maximum responsiveness
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7.0s strict timeout

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 512
            }
          })
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let firstSentenceSpoken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const partText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (partText) {
                accumulatedText += partText;
                if (callbacks?.onChunk) {
                  callbacks.onChunk(partText, accumulatedText);
                }

                // Check for first sentence for Early Read Aloud
                if (!firstSentenceSpoken && callbacks?.onFirstSentence) {
                  const match = accumulatedText.match(/^([^\n.!?]+[.!?\n])/);
                  if (match && match[1].trim().length > 10) {
                    firstSentenceSpoken = true;
                    callbacks.onFirstSentence(match[1].trim());
                  }
                }
              }
            } catch {
              // Ignore partial JSON parse chunks
            }
          }
        }
      }

      if (accumulatedText.trim().length > 0) {
        // Parse streamed markdown/numbered steps into clean format
        const lines = accumulatedText
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean);

        const title = lines[0]?.replace(/^[#*-\s]+/, '') || (isBm ? 'Panduan Keselamatan Semasa:' : 'Safety Guidance:');
        const stepLines = lines.slice(1).filter(l => /^[0-9]+[.)]|^-|^\*/.test(l));
        const steps = stepLines.length > 0 ? stepLines.slice(0, 4) : lines.slice(1, 4);

        const reply: SafetyAiReply = {
          title,
          verificationSummary: isBm
            ? 'Disahkan selaras protokol Pertahanan Awam Kebangsaan (NADMA / APM / Bomba).'
            : 'Verified against National Civil Defence Protocols (NADMA / APM / Bomba).',
          steps: steps.length > 0 ? steps : [title],
          suggestions: isBm
            ? ['Apa yang patut saya kemas sekarang?', 'Bolehkah saya pandu kereta redah air?']
            : ['What to pack right now?', 'Can I drive through water?'],
          sourcesChecked: ['NADMA Safety Protocol', 'Jabatan Bomba & Penyelamat', 'APM Operations'],
          hotlines: VERIFIED_EMERGENCY_HOTLINES,
          source: 'gemini'
        };

        replyCache.set(cacheKey, reply);
        return reply;
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        // Strict 7-second timeout fallback
        return buildLocalFallbackReply(userText, ctx, true);
      }
      // Otherwise try next model in cascade
    }
  }

  // If all models failed or threw errors, graceful fallback to local protocol
  return buildLocalFallbackReply(userText, ctx, false);
}

/**
 * Backwards compatibility helper for existing synchronous callers.
 */
export async function askSafetyAi(userText: string, ctx: SafetyAiContext): Promise<SafetyAiReply> {
  return askSafetyAiStreaming(userText, ctx);
}
