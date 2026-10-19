import type { Language, ScenarioData, ShelterInfo, LiveWeather } from '../types';
import { AI_KNOWLEDGE_BASE } from '../data/translations';
import { fetchLiveWeather } from './weather';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const hasGeminiKey = () => Boolean(GEMINI_KEY);

export interface SafetyAiReply {
  title: string;
  verificationSummary?: string;
  sourcesChecked?: string[];
  steps: string[];
  suggestions: string[];
  source: 'gemini' | 'offline';
}

export interface SafetyAiContext {
  language: Language;
  scenario: ScenarioData;
  selectedShelter: ShelterInfo;
  weather: LiveWeather | null;
  userLocation?: { lat: number; lon: number } | null;
}

const MALAYSIAN_PLACES = [
  'seremban', 'port dickson', 'nilai', 'rembau', 'tampin', 'kuala pilah', 'jelebu', 'jempol', 'negeri sembilan',
  'shah alam', 'klang', 'subang jaya', 'subang', 'petaling jaya', 'puchong', 'kajang', 'bangi', 'sepang',
  'rawang', 'kuala selangor', 'hulu langat', 'ampang', 'gombak', 'cyberjaya', 'selangor',
  'kuala lumpur', 'cheras', 'kepong', 'setapak', 'wangsa maju', 'brickfields', 'putrajaya',
  'melaka', 'alor gajah', 'jasin', 'ayer keroh',
  'johor bahru', 'batu pahat', 'muar', 'kluang', 'kota tinggi', 'segamat', 'mersing', 'pontian', 'kulai', 'pasir gudang', 'skudai', 'johor',
  'kuantan', 'temerloh', 'pekan', 'jerantut', 'raub', 'bentong', 'maran', 'bera', 'rompin', 'cameron highlands', 'lipis', 'pahang',
  'kuala terengganu', 'kemaman', 'dungun', 'besut', 'marang', 'huluterengganu', 'setiu', 'terengganu',
  'kota bharu', 'pasir mas', 'rantau panjang', 'tumpat', 'kuala krai', 'gua musang', 'tanah merah', 'machang', 'bachok', 'jeli', 'kelantan',
  'ipoh', 'taiping', 'teluk intan', 'manjung', 'kampar', 'kuala kangsar', 'tapah', 'bidor', 'parit buntar', 'perak',
  'alor setar', 'sungai petani', 'kulim', 'baling', 'kubang pasu', 'jitra', 'langkawi', 'yan', 'pendang', 'kedah',
  'george town', 'georgetown', 'bayan lepas', 'bukit mertajam', 'butterworth', 'nibong tebal', 'kepala batas', 'pulau pinang', 'penang',
  'kangar', 'arau', 'padang besar', 'perlis',
  'kuching', 'sibu', 'miri', 'bintulu', 'samarahan', 'sri aman', 'kapit', 'limbang', 'sarikei', 'sarawak',
  'kota kinabalu', 'sandakan', 'tawau', 'lahad datu', 'keningau', 'penampang', 'tuaran', 'beaufort', 'kota belud', 'sabah'
];

/**
 * Detects if the user wrote their question in Bahasa Melayu or English so the bot replies in the same language.
 */
function detectQueryLanguage(text: string, fallback: Language): Language {
  const lower = text.toLowerCase();
  const bmWords = /\b(ada|adakah|banjir|ke|di|dekat|kat|macam|mana|apa|boleh|tak|tidak|perlu|patut|saya|kami|rumah|air|naik|jalan|kereta|selamat|sekarang|hari|ini|tolong|bantuan|sungai|hujan)\b/;
  const enWords = /\b(is|are|there|flood|flooding|in|at|near|what|how|can|should|my|house|water|rising|safe|now|today|help|shelter|drive)\b/;
  const bmMatch = bmWords.test(lower);
  const enMatch = enWords.test(lower);
  if (bmMatch && !enMatch) return 'bm';
  if (enMatch && !bmMatch) return 'en';
  return fallback;
}

/**
 * Extracts ALL queried Malaysian place names (up to 3) from the user's question in order of appearance.
 */
function extractMentionedPlaces(text: string): string[] {
  const lower = text.toLowerCase().replace(/[?!.,]/g, ' ').trim();
  const found: { name: string; index: number }[] = [];

  // 1. Check known Malaysian towns/cities/states (longest match first to avoid substring collisions like "subang" inside "subang jaya")
  const sorted = [...MALAYSIAN_PLACES].sort((a, b) => b.length - a.length);
  let masked = lower;

  for (const place of sorted) {
    const regex = new RegExp(`\\b${place}\\b`, 'i');
    const match = regex.exec(masked);
    if (match && match.index !== undefined) {
      found.push({
        name: place
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        index: match.index
      });
      // Mask matched characters so shorter substrings don't double-match
      masked =
        masked.slice(0, match.index) +
        ' '.repeat(place.length) +
        masked.slice(match.index + place.length);
    }
  }

  if (found.length > 0) {
    return found
      .sort((a, b) => a.index - b.index)
      .slice(0, 3)
      .map(f => f.name);
  }

  // 2. Check preposition pattern: "di <place>", "dekat <place>", "in <place>", "at <place>"
  const prepMatch = lower.match(/\b(?:di|dekat|kat|in|at|near|around)\s+([a-z]{3,}(?:\s+[a-z]{3,})?)$/i);
  if (prepMatch?.[1]) {
    const candidate = prepMatch[1].trim();
    const stopWords = new Set(['rumah', 'house', 'sini', 'here', 'situ', 'there', 'dalam', 'luar', 'dapur', 'jalan', 'kereta', 'car', 'water', 'air', 'malaysia']);
    if (!stopWords.has(candidate.split(' ')[0])) {
      return [
        candidate
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      ];
    }
  }

  return [];
}

interface ResearchedTelemetry {
  locationLabel: string;
  lat: number;
  lon: number;
  weather: LiveWeather | null;
  riverDischargeM3s: number | null;
  riverDischargeMeanM3s: number | null;
  riverDischargeMaxM3s: number | null;
  elevationM: number | null;
  sources: string[];
}

/**
 * Geocode a single place in Malaysia and fetch live OpenWeather + Copernicus GloFAS river discharge telemetry.
 */
async function researchSingleLocation(
  placeQuery: string | null,
  ctx: SafetyAiContext,
  lang: Language
): Promise<ResearchedTelemetry> {
  const sources: string[] = [];
  let lat = ctx.userLocation?.lat ?? ctx.scenario.lat;
  let lon = ctx.userLocation?.lon ?? ctx.scenario.lon;
  let locationLabel = `${ctx.scenario.locationName} (${ctx.scenario.locationArea})`;
  let targetWeather: LiveWeather | null = placeQuery ? null : ctx.weather;

  if (placeQuery) {
    let geocoded = false;
    if (OWM_KEY) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(placeQuery + ',MY')}&limit=1&appid=${OWM_KEY}`
        );
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr) && arr[0]) {
            lat = arr[0].lat;
            lon = arr[0].lon;
            locationLabel = arr[0].state ? `${arr[0].name}, ${arr[0].state}` : `${arr[0].name}, Malaysia`;
            geocoded = true;
          }
        }
      } catch {
        // Fallback to Google Geocoding below
      }
    }

    if (!geocoded && GOOGLE_KEY) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeQuery + ', Malaysia')}&key=${GOOGLE_KEY}`
        );
        if (res.ok) {
          const data = await res.json();
          const loc = data?.results?.[0]?.geometry?.location;
          if (loc) {
            lat = loc.lat;
            lon = loc.lng;
            locationLabel = data.results[0].formatted_address || `${placeQuery}, Malaysia`;
          }
        }
      } catch {
        // Keep scenario coordinates if offline
      }
    }
  }

  const weatherPromise =
    targetWeather
      ? Promise.resolve(targetWeather)
      : fetchLiveWeather(lat, lon, lang).catch(() => null);

  const floodPromise = fetch(
    `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_mean,river_discharge_max&forecast_days=3`
  )
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);

  const [wx, floodData] = await Promise.all([weatherPromise, floodPromise]);

  if (wx) {
    targetWeather = wx;
    sources.push(`OpenWeather (${placeQuery || wx.placeName}: ${Math.round(wx.tempC)}°C, ${wx.rain24hMm.toFixed(1)}mm/24h)`);
  }

  let riverDischargeM3s: number | null = null;
  let riverDischargeMeanM3s: number | null = null;
  let riverDischargeMaxM3s: number | null = null;
  let elevationM: number | null = null;

  if (floodData?.daily) {
    riverDischargeM3s = floodData.daily.river_discharge?.[0] ?? null;
    riverDischargeMeanM3s = floodData.daily.river_discharge_mean?.[0] ?? null;
    riverDischargeMaxM3s = floodData.daily.river_discharge_max?.[0] ?? null;
    elevationM = typeof floodData.elevation === 'number' ? floodData.elevation : null;
    if (riverDischargeM3s !== null) {
      sources.push(`GloFAS (${placeQuery || locationLabel.split(',')[0]}: ${riverDischargeM3s.toFixed(2)} m³/s)`);
    }
  }

  return {
    locationLabel,
    lat,
    lon,
    weather: targetWeather,
    riverDischargeM3s,
    riverDischargeMeanM3s,
    riverDischargeMaxM3s,
    elevationM,
    sources
  };
}

/**
 * Offline keyword matcher with safe fallback and telemetry summary when Gemini is unreachable.
 */
export function matchOfflineKnowledgeBase(
  userText: string,
  language: Language,
  scenario: ScenarioData,
  telemetry?: ResearchedTelemetry
): SafetyAiReply {
  const lower = userText.toLowerCase();

  if (/\b(pack|kemas|bag|beg|barang|dokumen|mykad)\b/.test(lower)) {
    const kb = AI_KNOWLEDGE_BASE.pack[language];
    return { ...kb, source: 'offline', sourcesChecked: ['NADMA 72-Hour Evacuation Kit Protocol'] };
  }
  if (/\b(drive|car|pandu|kereta|redah|vehicle)\b/.test(lower)) {
    const kb = AI_KNOWLEDGE_BASE.drive[language];
    return { ...kb, source: 'offline', sourcesChecked: ['Bomba & Penyelamat Road Flood Safety'] };
  }
  if (/\b(power|electric|elektrik|suis|fuse|mcb|breaker|plug|soket)\b/.test(lower)) {
    const kb = AI_KNOWLEDGE_BASE.power[language];
    return { ...kb, source: 'offline', sourcesChecked: ['Suruhanjaya Tenaga / TNB Flood Safety'] };
  }
  if (/\b(trap|perangkap|house|rumah|masuk|rising|naik|bumbung|roof)\b/.test(lower)) {
    const kb = AI_KNOWLEDGE_BASE.trapped[language];
    return { ...kb, source: 'offline', sourcesChecked: ['NADMA / APM Indoor Flood Rescue SOP'] };
  }

  // If we have live telemetry for the queried place (even if Gemini failed), build a real data-backed answer!
  if (telemetry && (telemetry.weather || telemetry.riverDischargeM3s !== null)) {
    const wx = telemetry.weather;
    const discharge = telemetry.riverDischargeM3s;
    const mean = telemetry.riverDischargeMeanM3s;
    const isElevatedRiver = discharge !== null && mean !== null && discharge > mean * 1.35;
    const isHeavyRain = wx ? wx.rain1hMm >= 10 || wx.rain24hMm >= 30 : false;

    if (language === 'bm') {
      const statusText = isElevatedRiver || isHeavyRain
        ? `Berjaga-jaga: Hujan/kadar aliran sungai tinggi dikesan di ${telemetry.locationLabel}`
        : `Tiada Limpahan Sungai Kritikal Dikesan di ${telemetry.locationLabel}`;
      return {
        title: `Status Semakan Banjir: ${telemetry.locationLabel}`,
        verificationSummary: `${statusText}. ${wx ? `Cuaca semasa: ${wx.description} (${Math.round(wx.tempC)}°C), hujan 1 jam: ${wx.rain1hMm.toFixed(1)}mm, unjuran 24 jam: ${wx.rain24hMm.toFixed(1)}mm.` : ''} ${discharge !== null ? `Kadar luahan sungai GloFAS: ${discharge.toFixed(2)} m³/s (purata normal: ${mean?.toFixed(2) ?? '—'} m³/s).` : ''}`,
        sourcesChecked: telemetry.sources,
        steps: [
          `1. Semakan Cuaca & Sungai (${telemetry.locationLabel}): ${wx ? `${wx.description}, kebarangkalian hujan ${Math.round(wx.maxRainChance * 100)}% dalam 24 jam akan datang.` : 'Pantau perubahan cuaca setempat.'}`,
          `2. Pengesahan Aras Sungai Rasmi: Semak bacaan tolok sungai JPS masa nyata di portal rasmi publicinfobanjir.water.gov.my bagi daerah ${telemetry.locationLabel}.`,
          `3. Langkah Berjaga-jaga: Elakkan melalui jalan rendah atau jambatan bawah jika hujan lebat berterusan melebihi 1 jam.`,
          `4. Talian Kecemasan: Simpan nombor MERS 999 dan Bomba 994 sekiranya berlaku banjir kilat mendadak.`
        ],
        suggestions: ['Apa yang patut saya kemas sekarang?', 'Bolehkah saya pandu kereta redah air?'],
        source: 'offline'
      };
    }

    const statusEn = isElevatedRiver || isHeavyRain
      ? `Caution: Elevated rainfall/river flow detected in ${telemetry.locationLabel}`
      : `No Critical River Overflow Detected in ${telemetry.locationLabel}`;
    return {
      title: `Verified Flood Status: ${telemetry.locationLabel}`,
      verificationSummary: `${statusEn}. ${wx ? `Current weather: ${wx.description} (${Math.round(wx.tempC)}°C), 1h rain: ${wx.rain1hMm.toFixed(1)}mm, 24h forecast: ${wx.rain24hMm.toFixed(1)}mm.` : ''} ${discharge !== null ? `GloFAS river discharge: ${discharge.toFixed(2)} m³/s (normal mean: ${mean?.toFixed(2) ?? '—'} m³/s).` : ''}`,
      sourcesChecked: telemetry.sources,
      steps: [
        `1. Live Weather & Hydrology (${telemetry.locationLabel}): ${wx ? `${wx.description}, ${Math.round(wx.maxRainChance * 100)}% max rain probability over the next 24h.` : 'Monitor local rainfall conditions.'}`,
        `2. Official River Gauge Check: Cross-check live JPS telemetry gauges on publicinfobanjir.water.gov.my for ${telemetry.locationLabel}.`,
        `3. Flash Flood Precaution: Avoid low-lying underpasses and riverbanks if continuous heavy rain exceeds 1 hour.`,
        `4. Emergency Readiness: Keep MERS 999 and Bomba 994 ready in case of sudden flash flooding.`
      ],
      suggestions: ['What to pack right now?', 'Can I drive through water?'],
      source: 'offline'
    };
  }

  const nearest = scenario.shelters[0];
  if (language === 'bm') {
    return {
      title: `Panduan Kecemasan (${scenario.locationName}):`,
      steps: [
        `1. Jika nyawa terancam atau air naik mendadak, hubungi MERS 999 atau Bomba 994 serta-merta.`,
        `2. Pusat Pemindahan Sementara (PPS) terdekat: ${nearest.nameBm} (${nearest.distanceKm} km, ~${nearest.walkMinutes} minit berjalan) di ${nearest.address}.`,
        `3. Tutup suis utama elektrik (MCB) sebelum berpindah dan jangan sesekali meredah air banjir dengan kenderaan.`,
        `4. Bawa MyKad, ubat penting, telefon & powerbank di dalam beg plastik kedap udara.`
      ],
      suggestions: ['Apa yang patut saya kemas sekarang?', 'Perlukah saya tutup suis utama elektrik?'],
      source: 'offline',
      sourcesChecked: ['NADMA / APM Emergency Protocol']
    };
  }

  return {
    title: `Emergency Safety Guidance (${scenario.locationName}):`,
    steps: [
      `1. If you are in immediate danger or water is rising rapidly, dial MERS 999 or Bomba 994 immediately.`,
      `2. Nearest open relief shelter (PPS): ${nearest.name} (${nearest.distanceKm} km, ~${nearest.walkMinutes} min walk) at ${nearest.address}.`,
      `3. Switch OFF your main electrical breaker (MCB) before evacuating and never drive through floodwater.`,
      `4. Pack your IC/MyKad, essential medications, phone, and powerbank in a sealed waterproof bag.`
    ],
    suggestions: ['What to pack right now?', 'Should I switch off the main breaker?'],
    source: 'offline',
    sourcesChecked: ['NADMA / APM Emergency Protocol']
  };
}

/**
 * Multi-Stage Deep Research & Verification Pipeline:
 * 1. Detects query language (BM vs EN) and extracts any mentioned Malaysian town/city (e.g., "Seremban").
 * 2. Researches live OpenWeather telemetry + 24h rainfall forecast + Copernicus GloFAS river discharge (m³/s) & elevation.
 * 3. Runs Gemini 3.8 Flash with full thinking budget (maxOutputTokens: 4096) to verify facts against telemetry before answering.
 */
export async function askSafetyAi(userText: string, ctx: SafetyAiContext): Promise<SafetyAiReply> {
  const effectiveLang = detectQueryLanguage(userText, ctx.language);
  const mentionedPlaces = extractMentionedPlaces(userText);

  // Run live telemetry research in parallel for ALL mentioned places (or current scenario location if none)
  let telemetries: ResearchedTelemetry[] = [];
  if (navigator.onLine) {
    const targets = mentionedPlaces.length > 0 ? mentionedPlaces : [null];
    telemetries = await Promise.all(targets.map(p => researchSingleLocation(p, ctx, effectiveLang)));
  }

  const primaryTelemetry = telemetries[0];
  const allSources = [
    ...Array.from(new Set(telemetries.flatMap(t => t.sources))),
    'NADMA / JPS PublicInfoBanjir & MetMalaysia Protocol'
  ];

  if (!GEMINI_KEY || !navigator.onLine) {
    return matchOfflineKnowledgeBase(userText, effectiveLang, ctx.scenario, primaryTelemetry);
  }

  const { scenario, selectedShelter } = ctx;
  const langInstruction =
    effectiveLang === 'bm'
      ? 'Respond strictly in natural Malaysian Bahasa Melayu (BM). Every field (title, verificationSummary, steps, suggestions) MUST be in Bahasa Melayu.'
      : 'Respond strictly in clear, calm English. Every field (title, verificationSummary, steps, suggestions) MUST be in English.';

  const isDifferentCity = mentionedPlaces.length > 0;

  const telemetryBlock = telemetries
    .map((tel, idx) => {
      const wx = tel.weather ?? (!isDifferentCity ? ctx.weather : null);
      return [
        `[LOCATION ${idx + 1}: ${tel.locationLabel} (Coords: ${tel.lat.toFixed(4)}, ${tel.lon.toFixed(4)})]`,
        tel.elevationM !== null ? `- Terrain Elevation: ${Math.round(tel.elevationM)} meters above sea level` : null,
        wx
          ? `- Live OpenWeather Telemetry: ${Math.round(wx.tempC)}°C (feels like ${Math.round(wx.feelsLikeC)}°C), condition: "${wx.description}", humidity: ${wx.humidity}%, wind: ${(wx.windMs * 3.6).toFixed(0)} km/h, current 1h rain: ${wx.rain1hMm.toFixed(1)} mm, next 24h forecast total rain: ${wx.rain24hMm.toFixed(1)} mm, max rain probability: ${Math.round(wx.maxRainChance * 100)}%.`
          : '- Live OpenWeather Telemetry: unavailable',
        tel.riverDischargeM3s !== null
          ? `- Live Copernicus GloFAS Satellite River Discharge: ${tel.riverDischargeM3s.toFixed(2)} m³/s today (Historical Normal Mean: ${tel.riverDischargeMeanM3s?.toFixed(2) ?? 'N/A'} m³/s, Forecast 3-Day Max: ${tel.riverDischargeMaxM3s?.toFixed(2) ?? 'N/A'} m³/s). Status: ${
              tel.riverDischargeMeanM3s && tel.riverDischargeM3s > tel.riverDischargeMeanM3s * 1.35
                ? 'ELEVATED RIVER FLOW ABOVE NORMAL MEAN'
                : 'NORMAL RIVER FLOW (BELOW/NEAR MEAN — NO MAJOR RIVER OVERFLOW DETECTED BY SATELLITE)'
            }`
          : null
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const targetNames = telemetries.map(t => t.locationLabel).join(' & ');

  const scenarioContextBlock = isDifferentCity
    ? `Note: The user is specifically asking about: ${targetNames}. Give verified telemetry findings for EVERY location they asked about (${targetNames}) using the Researched Live Telemetry above!`
    : `ACTIVE SCENARIO CONTEXT (${scenario.locationName}):
- Alert Tier: ${scenario.riskLevel.toUpperCase()} — ${scenario.headlineEn}
- Directive: ${scenario.directiveEn}
- Nearest Open Shelter (PPS): ${selectedShelter.name} (${selectedShelter.distanceKm}km away, ${selectedShelter.walkMinutes} min walk, Address: ${selectedShelter.address}, Phone: ${selectedShelter.phone}, Capacity: ${selectedShelter.capacityCurrent}/${selectedShelter.capacityTotal})`;

  const systemPrompt = `You are the Terra Guard V2 Deep-Research Flood & Disaster Safety AI for Malaysia.
${langInstruction}

YOUR MANDATORY DEEP-RESEARCH & VERIFICATION PROTOCOL:
1. Analyze the user's exact question first. Answer their specific question directly—never give a generic template that ignores what they asked.
2. Cross-verify your answer against the LIVE RESEARCHED TELEMETRY below (OpenWeather live rain/forecast + Copernicus GloFAS river discharge in m³/s + elevation) for EVERY location listed.
3. Be 100% honest and transparent:
   - Cite the exact numbers from the Live Researched Telemetry in your "verificationSummary" for EACH queried location (temperature, rainfall in mm, river discharge in m³/s vs normal mean, and elevation in meters).
   - Explain clearly that satellite river discharge (GloFAS) measures major river basin overflow, while sudden street-level flash floods can still happen if urban drains clog during heavy storms—so citizens can also check JPS Malaysia's official river-level sensors (PublicInfoBanjir: publicinfobanjir.water.gov.my).
   - Never invent fake shelters, fake road closures, or unverified phone numbers.

LIVE RESEARCHED TELEMETRY (FETCHED JUST NOW):
${telemetryBlock}

${scenarioContextBlock}

VERIFIED MALAYSIAN CIVIL DEFENCE (NADMA / APM / BOMBA / JPS) RULES:
- Emergency Hotlines: MERS 999 (Police/Ambulance), Bomba & Penyelamat 994 (Flood rescue), APM +603-8051 8888, JKM Welfare +603-8323 1396.
- Official Portals: JPS PublicInfoBanjir (publicinfobanjir.water.gov.my) for real-time Malaysian river water-level sensors; MetMalaysia (met.gov.my) for thunderstorm/monsoon warnings.
- Driving Rule: 15cm of water stalls cars; 30cm of moving water floats sedans.
- Electrical Rule: Switch OFF main MCB breaker before water reaches outlets. Never touch switches with wet hands.

OUTPUT FORMAT REQUIREMENTS:
Return ONLY valid JSON with this exact structure:
{
  "title": "Direct, specific 1-line headline answering the user's exact question for all queried locations",
  "verificationSummary": "2-3 sentences summarizing the verified live data researched for EVERY queried location (cite exact OpenWeather temp/rain mm, Copernicus GloFAS river discharge m³/s vs normal mean, and elevation)",
  "steps": [
    "1. First concrete, verified step directly addressing their question...",
    "2. Second concrete step...",
    "3. Third concrete step...",
    "4. Fourth concrete step (include official portal publicinfobanjir.water.gov.my, specific shelter, or MERS 999 / Bomba 994)"
  ],
  "suggestions": [
    "Relevant follow-up question 1 (under 45 chars)",
    "Relevant follow-up question 2 (under 45 chars)"
  ]
}`;

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userText }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed.title === 'string' && Array.isArray(parsed.steps)) {
        return {
          title: parsed.title,
          verificationSummary: typeof parsed.verificationSummary === 'string' ? parsed.verificationSummary : undefined,
          sourcesChecked: allSources,
          steps: parsed.steps.map(String).slice(0, 5),
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String).slice(0, 3) : [],
          source: 'gemini'
        };
      }
    } catch {
      // Try next Gemini model
    }
  }

  return matchOfflineKnowledgeBase(userText, effectiveLang, scenario, primaryTelemetry);
}
