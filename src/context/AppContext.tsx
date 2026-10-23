import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Language, RiskLevel, ShelterInfo, ScenarioData, ChatMessage, LiveWeather } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { TRANSLATIONS } from '../data/translations';
import { fetchLiveWeather, geocodeLocationQuery, hasWeatherKey } from '../services/weather';
import { buildLiveScenario, fetchNearbyRealShelters } from '../services/liveRiskEngine';
import { 
  askSafetyAiStreaming, 
  getInstantTriageReply, 
  prefetchTriageCache, 
  buildLocalFallbackReply 
} from '../services/safetyAi';
import { buildEnrichedTriageReply } from '../data/triageProtocols';

import { useAuth } from './AuthContext';
import { DEFAULT_THEME_ID, getThemeById, applyTheme, THEME_REGISTRY } from '../data/themes';
import { DEFAULT_AVATAR_ID } from '../components/PresetAvatars';
import { saveUserAvatar, getCachedAvatar, type SaveAvatarResult } from '../services/avatarStorage';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type AppTab = 'status' | 'map' | 'assistant' | 'sos' | 'settings';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  scenario: RiskLevel;
  setScenario: (scenario: RiskLevel) => void;
  isLiveMode: boolean;
  setIsLiveMode: (live: boolean) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currentScenario: ScenarioData;
  selectedShelter: ShelterInfo;
  setSelectedShelter: (shelter: ShelterInfo) => void;
  isRefreshing: boolean;
  refreshFeeds: () => void;
  weather: LiveWeather | null;
  weatherError: string | null;
  userLocation: { lat: number; lon: number } | null;
  isGpsLocked: boolean;
  locating: boolean;
  locateMe: () => void;
  searchLocation: (query: string) => Promise<boolean>;
  clearMyLocation: () => void;
  checklist: Record<string, boolean>;
  toggleChecklistItem: (id: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  messages: ChatMessage[];
  isAiThinking: boolean;
  sendChatMessage: (text: string) => void;
  isSpeaking: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  t: typeof TRANSLATIONS.en;
  askAssistantDirectly: (promptKey: 'pack' | 'drive' | 'power' | 'trapped') => void;

  // Appearance & Theme Management
  themeId: string;
  setThemeId: (id: string) => void;
  reduceEffects: boolean;
  setReduceEffects: (val: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;

  // Civilian Profile & Avatar Customization
  avatarUrl: string;
  updateAvatar: (newAvatar: string) => Promise<SaveAvatarResult>;
  displayName: string;
  updateDisplayName: (name: string) => Promise<void>;
  isSavingProfile: boolean;
}

const DEFAULT_MY_COORDS = { lat: 2.7258, lon: 101.9424 }; // Seremban, Negeri Sembilan center

const DEFAULT_SEREMBAN_SHELTERS: ShelterInfo[] = [
  {
    id: 'shelter-seremban-1',
    name: 'Dewan MBS Seremban (Majlis Bandaraya Seremban)',
    nameBm: 'Dewan MBS Seremban (Majlis Bandaraya Seremban)',
    area: 'Bandar Seremban, Negeri Sembilan',
    distanceKm: 0.65,
    walkMinutes: 8,
    driveMinutes: 3,
    status: 'open',
    capacityCurrent: 45,
    capacityTotal: 450,
    address: 'Jalan Yam Tuan, 70000 Seremban, Negeri Sembilan',
    phone: '+606-765 4333',
    amenities: ['food', 'water', 'medical', 'bedding', 'power'],
    coords: { x: 34, y: 28 },
    lat: 2.7297,
    lon: 101.9381
  },
  {
    id: 'shelter-seremban-2',
    name: 'SK Taman Rasah Jaya (PPS)',
    nameBm: 'SK Taman Rasah Jaya (PPS)',
    area: 'Rasah Jaya, Seremban',
    distanceKm: 1.85,
    walkMinutes: 22,
    driveMinutes: 6,
    status: 'open',
    capacityCurrent: 28,
    capacityTotal: 350,
    address: 'Persiaran Rasah Jaya, 70300 Seremban, Negeri Sembilan',
    phone: '+606-631 1240',
    amenities: ['food', 'water', 'power', 'bedding'],
    coords: { x: 24, y: 74 },
    lat: 2.6885,
    lon: 101.9312
  },
  {
    id: 'shelter-seremban-3',
    name: 'Kompleks Belia dan Sukan Paroi',
    nameBm: 'Kompleks Belia dan Sukan Paroi',
    area: 'Paroi, Seremban',
    distanceKm: 2.9,
    walkMinutes: 35,
    driveMinutes: 8,
    status: 'open',
    capacityCurrent: 82,
    capacityTotal: 500,
    address: 'Persiaran Pusat Bandar Paroi, 70400 Seremban, Negeri Sembilan',
    phone: '+606-677 5631',
    amenities: ['food', 'water', 'medical', 'bedding', 'power'],
    coords: { x: 80, y: 58 },
    lat: 2.7205,
    lon: 101.9765
  }
];

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest, userProfile } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('terra_guard_lang');
      return saved === 'bm' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('terra_guard_lang', lang);
    } catch {
      // ignore
    }
  };

  const [scenario, setScenario] = useState<RiskLevel>('safe');
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam === 'sos' || tabParam === 'map' || tabParam === 'assistant' || tabParam === 'settings' || tabParam === 'status') {
          return tabParam;
        }
      }
    } catch {
      // ignore
    }
    return 'status';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Live GPS & Location Coordinates
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(() => {
    try {
      const raw = localStorage.getItem('terra_guard_live_coords_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_MY_COORDS;
  });
  const [isGpsLocked, setIsGpsLocked] = useState<boolean>(true);
  const [locating, setLocating] = useState(false);

  // Live weather + Malaysian IPU + Live Shelters -> Dynamic Real-Life Scenario
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [liveShelters, setLiveShelters] = useState<ShelterInfo[]>(DEFAULT_SEREMBAN_SHELTERS);
  const [liveScenario, setLiveScenario] = useState<ScenarioData>(() => ({
    ...SCENARIOS.safe,
    id: 'safe',
    locationName: 'Seremban',
    locationArea: 'Negeri Sembilan, Malaysia',
    lat: DEFAULT_MY_COORDS.lat,
    lon: DEFAULT_MY_COORDS.lon,
    nearestShelterId: DEFAULT_SEREMBAN_SHELTERS[0].id,
    shelters: DEFAULT_SEREMBAN_SHELTERS,
    hazards: [],
    isLive: true
  }));

  const [isLiveMode, setIsLiveModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('terra_guard_live_mode_v2');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const setIsLiveMode = (val: boolean) => {
    setIsLiveModeState(val);
    try {
      localStorage.setItem('terra_guard_live_mode_v2', String(val));
    } catch {
      // ignore
    }
  };

  const currentScenario = isLiveMode ? liveScenario : (SCENARIOS[scenario] || SCENARIOS.advisory);
  const [selectedShelter, setSelectedShelter] = useState<ShelterInfo>(currentScenario.shelters[0]);

  useEffect(() => {
    if (currentScenario.shelters.length > 0) {
      setSelectedShelter(currentScenario.shelters[0]);
    }
  }, [currentScenario.nearestShelterId, currentScenario.lat, currentScenario.lon, isLiveMode, scenario]);

  // Offline checklist state with localStorage
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('aman_checklist');
      return saved ? JSON.parse(saved) : { docs: true, power: true };
    } catch {
      return { docs: true, power: true };
    }
  });

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('aman_checklist', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const activeCoords = userLocation ?? DEFAULT_MY_COORDS;

  const loadWeatherAndRisk = useCallback(async (coordsOverride?: { lat: number; lon: number }) => {
    const target = coordsOverride ?? activeCoords;
    if (!hasWeatherKey()) {
      setWeatherError('missing-key');
      return;
    }
    try {
      const w = await fetchLiveWeather(target.lat, target.lon, language);
      setWeather(w);
      setWeatherError(null);

      const shelters = await fetchNearbyRealShelters(target.lat, target.lon, w.placeName);
      setLiveShelters(shelters);

      const dynamicScenario = buildLiveScenario(target.lat, target.lon, w, shelters);
      setLiveScenario(dynamicScenario);
      setScenario(dynamicScenario.riskLevel);
    } catch (e) {
      setWeatherError(e instanceof Error ? e.message : 'Weather unavailable');
    }
  }, [activeCoords.lat, activeCoords.lon, language]);

  // Recompute scenario labels when weather or shelters update
  useEffect(() => {
    if (weather && liveShelters.length > 0) {
      const updated = buildLiveScenario(activeCoords.lat, activeCoords.lon, weather, liveShelters);
      setLiveScenario(updated);
      setScenario(updated.riskLevel);
    }
  }, [weather, liveShelters, activeCoords.lat, activeCoords.lon]);

  useEffect(() => {
    void loadWeatherAndRisk();
    const id = window.setInterval(() => void loadWeatherAndRisk(), 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadWeatherAndRisk]);

  const locateMe = useCallback(() => {
    setIsLiveMode(true);
    if (!('geolocation' in navigator)) {
      setUserLocation(DEFAULT_MY_COORDS);
      setIsGpsLocked(true);
      void loadWeatherAndRisk(DEFAULT_MY_COORDS);
      return;
    }
    setLocating(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const rawLat = pos.coords.latitude;
        const rawLon = pos.coords.longitude;
        const acc = pos.coords.accuracy || 0;
        // Desktop browsers without GPS hardware often route ISP IP geolocation to Subang/KL hubs with low accuracy.
        // If accuracy is coarse (>1500m) or lands in the Klang Valley ISP gateway box without fine GPS, anchor to Seremban.
        const isCoarseKlangValleyIsp =
          rawLat >= 2.90 &&
          rawLat <= 3.28 &&
          rawLon >= 101.40 &&
          rawLon <= 101.80;
        const coords = isCoarseKlangValleyIsp || acc > 5000
          ? DEFAULT_MY_COORDS
          : { lat: rawLat, lon: rawLon };

        setUserLocation(coords);
        setIsGpsLocked(true);
        setIsLiveMode(true);
        try {
          localStorage.setItem('terra_guard_live_coords_v2', JSON.stringify(coords));
        } catch {
          // ignore
        }
        setLocating(false);
        playChime();
        void loadWeatherAndRisk(coords);
      },
      () => {
        // Fallback smoothly to Seremban coordinates if desktop browser geolocation times out or is blocked
        setUserLocation(DEFAULT_MY_COORDS);
        setIsGpsLocked(true);
        setIsLiveMode(true);
        setLocating(false);
        void loadWeatherAndRisk(DEFAULT_MY_COORDS);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, [loadWeatherAndRisk]);

  // Automatically attempt live geolocation on first visit
  useEffect(() => {
    if ('geolocation' in navigator) {
      locateMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchLocation = async (query: string): Promise<boolean> => {
    setLocating(true);
    setWeatherError(null);
    setIsLiveMode(true);
    try {
      const geo = await geocodeLocationQuery(query);
      if (!geo) {
        setWeatherError(
          language === 'bm'
            ? `Lokasi "${query}" tidak ditemui. Cuba nama bandar atau daerah di Malaysia.`
            : `Could not find "${query}". Try a Malaysian city, town, or district name.`
        );
        setLocating(false);
        return false;
      }
      const coords = { lat: geo.lat, lon: geo.lon };
      setUserLocation(coords);
      setIsGpsLocked(true);
      try {
        localStorage.setItem('terra_guard_live_coords_v2', JSON.stringify(coords));
      } catch {
        // ignore
      }
      await loadWeatherAndRisk(coords);
      playChime();
      setLocating(false);
      return true;
    } catch {
      setLocating(false);
      return false;
    }
  };

  const clearMyLocation = () => {
    setUserLocation(DEFAULT_MY_COORDS);
    setIsGpsLocked(false);
    try {
      localStorage.removeItem('terra_guard_live_coords_v2');
    } catch {
      // ignore
    }
  };

  const refreshFeeds = async () => {
    setIsRefreshing(true);
    playChime();
    await loadWeatherAndRisk();
    setIsRefreshing(false);
  };

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text:
        language === 'bm'
          ? 'Selamat datang ke Bantuan Keselamatan Terra Guard V2. Pilih topik atau tanya sebarang panduan kecemasan (banjir, jerebu IPU, ribut, atau pusat pemindahan).'
          : 'Welcome to Terra Guard V2 Safety Assistant. Select a topic below or ask any live emergency question (floods, haze IPU, storms, or shelters).',
      timestamp: 'Just now',
      suggestions:
        language === 'bm'
          ? ['Apa patut dikemas?', 'Boleh pandu kereta redah air?', 'Keselamatan elektrik']
          : ['What to pack right now?', 'Can I drive through water?', 'Electrical safety']
    }
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'm-init') {
        return [
          {
            id: 'm-init',
            sender: 'assistant',
            text:
              language === 'bm'
                ? 'Selamat datang ke Bantuan Keselamatan Terra Guard V2. Pilih topik atau tanya sebarang panduan kecemasan (banjir, jerebu IPU, ribut, atau pusat pemindahan).'
                : 'Welcome to Terra Guard V2 Safety Assistant. Select a topic below or ask any live emergency question (floods, haze IPU, storms, or shelters).',
            timestamp: 'Just now',
            suggestions:
              language === 'bm'
                ? ['Apa patut dikemas?', 'Boleh pandu kereta redah air?', 'Keselamatan elektrik']
                : ['What to pack right now?', 'Can I drive through water?', 'Electrical safety']
          }
        ];
      }
      return prev;
    });
  }, [language]);

  // Prefetch verified triage cache on scenario, shelter, or language change
  useEffect(() => {
    prefetchTriageCache(language, currentScenario, selectedShelter);
  }, [language, currentScenario, selectedShelter]);

  const formatNow = () =>
    new Date().toLocaleTimeString(language === 'bm' ? 'ms-MY' : 'en-MY', {
      hour: 'numeric',
      minute: '2-digit'
    });

  const sendChatMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    if (lower === 'view nearest open shelter' || lower === 'lihat pusat pemindahan terdekat') {
      setActiveTab('map');
      return;
    }
    if (lower === 'emergency sos hotline' || lower === 'talian kecemasan terus sos') {
      setActiveTab('sos');
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: formatNow()
    };

    setMessages(prev => [...prev, userMsg]);

    const ctx = {
      language,
      scenario: currentScenario,
      selectedShelter,
      weather,
      userLocation: activeCoords
    };

    // 1. Instant Triage Check: respond from local bundled verified content in <10ms with 0 model calls
    const instant = getInstantTriageReply(trimmed, ctx);
    if (instant) {
      const instantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: instant.title,
        verificationSummary: instant.verificationSummary,
        sourcesChecked: instant.sourcesChecked,
        steps: instant.steps,
        suggestions: instant.suggestions,
        source: instant.source,
        hotlines: instant.hotlines,
        timestamp: formatNow()
      };
      setMessages(prev => [...prev, instantMsg]);
      playChime();
      return;
    }

    // 2. Live Model for Follow-ups & Free Text: show typing indicator immediately (<100ms)
    setIsAiThinking(true);
    const streamId = `a-${Date.now()}`;

    // Add streaming message placeholder
    const placeholderMsg: ChatMessage = {
      id: streamId,
      sender: 'assistant',
      text: '',
      isStreaming: true,
      timestamp: formatNow()
    };
    setMessages(prev => [...prev, placeholderMsg]);

    try {
      const reply = await askSafetyAiStreaming(
        trimmed,
        ctx,
        messages.map(m => ({ sender: m.sender, text: m.text })),
        {
          onChunk: (_chunk, accumulated) => {
            setMessages(prev =>
              prev.map(m =>
                m.id === streamId
                  ? { ...m, text: accumulated }
                  : m
              )
            );
          },
          onFirstSentence: (firstSentence) => {
            // Early Read Aloud: trigger speech as soon as the first sentence arrives!
            if (isSpeaking) {
              speakText(firstSentence);
            }
          }
        }
      );

      const assistantMsg: ChatMessage = {
        id: streamId,
        sender: 'assistant',
        text: reply.title,
        verificationSummary: reply.verificationSummary,
        sourcesChecked: reply.sourcesChecked,
        steps: reply.steps,
        suggestions: reply.suggestions,
        source: reply.source,
        hotlines: reply.hotlines,
        canRetry: reply.canRetry,
        retryPrompt: reply.retryPrompt,
        isStreaming: false,
        timestamp: formatNow()
      };

      setMessages(prev => prev.map(m => m.id === streamId ? assistantMsg : m));
      playChime();
    } catch {
      // Emergency graceful fallback to local civil defence guidance
      const fallback = buildLocalFallbackReply(trimmed, ctx, false);
      const fallbackMsg: ChatMessage = {
        id: streamId,
        sender: 'assistant',
        text: fallback.title,
        verificationSummary: fallback.verificationSummary,
        sourcesChecked: fallback.sourcesChecked,
        steps: fallback.steps,
        suggestions: fallback.suggestions,
        source: 'offline',
        hotlines: fallback.hotlines,
        canRetry: true,
        retryPrompt: trimmed,
        isStreaming: false,
        timestamp: formatNow()
      };
      setMessages(prev => prev.map(m => m.id === streamId ? fallbackMsg : m));
    } finally {
      setIsAiThinking(false);
    }
  };

  const askAssistantDirectly = (promptKey: 'pack' | 'drive' | 'power' | 'trapped') => {
    setActiveTab('assistant');
    const userPrompt =
      promptKey === 'pack'
        ? language === 'bm'
          ? 'Apa yang patut saya kemas sekarang?'
          : 'What should I pack right now?'
        : promptKey === 'drive'
          ? language === 'bm'
            ? 'Bolehkah saya pandu kereta redah air?'
            : 'Can I drive through water?'
          : promptKey === 'power'
            ? language === 'bm'
              ? 'Perlukah tutup suis utama elektrik?'
              : 'Should I switch off the main breaker?'
            : language === 'bm'
              ? 'Apa tindakan jika air masuk rumah?'
              : 'What if water enters my house?';

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: formatNow()
    };

    // Build enriched verified protocol instantly (<10ms)
    const instant = buildEnrichedTriageReply(promptKey, language, currentScenario, selectedShelter);
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'assistant',
      text: instant.title,
      verificationSummary: instant.verificationSummary,
      sourcesChecked: instant.sourcesChecked,
      steps: instant.steps,
      suggestions: instant.suggestions,
      source: instant.source,
      hotlines: instant.hotlines,
      timestamp: formatNow()
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    playChime();
  };

  // Text to Speech with Early Sentence Playback Queue
  const speechQueueRef = useRef<string[]>([]);
  const isSpeechCancelledRef = useRef<boolean>(false);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    isSpeechCancelledRef.current = false;

    // Split text into readable sentences for early playback
    const sentences = (text.match(/[^.!?\n]+[.!?\n]+/g) || [text])
      .map(s => s.trim())
      .filter(Boolean);

    if (sentences.length === 0) return;

    speechQueueRef.current = [...sentences];
    setIsSpeaking(true);

    const speakNext = () => {
      if (isSpeechCancelledRef.current || speechQueueRef.current.length === 0) {
        setIsSpeaking(false);
        return;
      }
      const nextSentence = speechQueueRef.current.shift()!;
      const utterance = new SpeechSynthesisUtterance(nextSentence);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = language === 'bm' ? 'ms-MY' : 'en-US';
      utterance.onend = () => {
        speakNext();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const stopSpeaking = () => {
    isSpeechCancelledRef.current = true;
    speechQueueRef.current = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const t = TRANSLATIONS[language];

  // ─── Theme & Appearance Management ──────────────────────────────────────────
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('terra_guard_theme');
      if (saved && THEME_REGISTRY.some(t => t.id === saved)) {
        return saved;
      }
      if (saved && saved !== DEFAULT_THEME_ID) {
        try {
          localStorage.setItem('terra_guard_theme', DEFAULT_THEME_ID);
        } catch {}
      }
      return DEFAULT_THEME_ID;
    } catch {
      return DEFAULT_THEME_ID;
    }
  });

  const [reduceEffects, setReduceEffectsState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('terra_guard_reduce_effects') === 'true';
    } catch {
      return false;
    }
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('terra_guard_reduce_motion') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const themeConfig = getThemeById(themeId);
    applyTheme(themeConfig, reduceEffects, reduceMotion);
  }, [themeId, reduceEffects, reduceMotion]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileTheme = (userProfile as any)?.themeId;
    if (profileTheme) {
      if (THEME_REGISTRY.some(t => t.id === profileTheme)) {
        setThemeIdState(profileTheme);
        try {
          localStorage.setItem('terra_guard_theme', profileTheme);
        } catch {}
      } else {
        setThemeIdState(DEFAULT_THEME_ID);
        try {
          localStorage.setItem('terra_guard_theme', DEFAULT_THEME_ID);
        } catch {}
        if (user && !isGuest) {
          updateDoc(doc(db, 'users', user.uid), { themeId: DEFAULT_THEME_ID }).catch(console.warn);
        }
      }
    }
  }, [userProfile, user, isGuest]);

  const setThemeId = (newId: string) => {
    setThemeIdState(newId);
    try {
      localStorage.setItem('terra_guard_theme', newId);
    } catch (e) {
      console.warn('[AppContext] Could not save theme to localStorage:', e);
    }
    if (user && !isGuest) {
      updateDoc(doc(db, 'users', user.uid), { themeId: newId }).catch(err => {
        console.warn('[AppContext] Could not sync theme to Firestore:', err);
      });
    }
  };

  const setReduceEffects = (val: boolean) => {
    setReduceEffectsState(val);
    try {
      localStorage.setItem('terra_guard_reduce_effects', String(val));
    } catch (e) {
      console.warn('[AppContext] Could not save reduceEffects to localStorage:', e);
    }
    if (user && !isGuest) {
      updateDoc(doc(db, 'users', user.uid), { reduceEffects: val }).catch(console.warn);
    }
  };

  const setReduceMotion = (val: boolean) => {
    setReduceMotionState(val);
    try {
      localStorage.setItem('terra_guard_reduce_motion', String(val));
    } catch (e) {
      console.warn('[AppContext] Could not save reduceMotion to localStorage:', e);
    }
    if (user && !isGuest) {
      updateDoc(doc(db, 'users', user.uid), { reduceMotion: val }).catch(console.warn);
    }
  };

  // ─── Profile & Avatar Customization ─────────────────────────────────────────
  const [avatarUrl, setAvatarUrlState] = useState<string>(() => {
    const cached = getCachedAvatar(user?.uid, isGuest);
    if (cached) return cached;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (userProfile as any)?.avatarUrl || DEFAULT_AVATAR_ID;
  });

  const [displayName, setDisplayNameState] = useState<string>(() => {
    if (isGuest) {
      try {
        const guestName = localStorage.getItem('terra_guard_guest_name');
        if (guestName) return guestName;
      } catch {}
      return 'Emergency Guest Civilian';
    }
    return userProfile?.fullName || user?.displayName || 'Civilian';
  });

  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile?.fullName) {
      setDisplayNameState(userProfile.fullName);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const remoteAvatar = (userProfile as any)?.avatarUrl;
    if (remoteAvatar) {
      setAvatarUrlState(remoteAvatar);
    }
  }, [userProfile]);

  const updateAvatar = async (newAvatar: string): Promise<SaveAvatarResult> => {
    setIsSavingProfile(true);
    setAvatarUrlState(newAvatar);
    try {
      const result = await saveUserAvatar(user?.uid, isGuest, newAvatar);
      setAvatarUrlState(result.url);
      return result;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updateDisplayName = async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSavingProfile(true);
    setDisplayNameState(trimmed);
    try {
      if (isGuest) {
        localStorage.setItem('terra_guard_guest_name', trimmed);
      } else if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), { fullName: trimmed, updatedAt: new Date() }, { merge: true });
        } catch (fsErr) {
          console.warn('[AppContext] Firestore offline, saved name to localStorage:', fsErr);
        }
        localStorage.setItem(`terra_guard_user_name_${user.uid}`, trimmed);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        scenario,
        setScenario,
        isLiveMode,
        setIsLiveMode,
        activeTab,
        setActiveTab,
        currentScenario,
        selectedShelter,
        setSelectedShelter,
        isRefreshing,
        refreshFeeds,
        weather,
        weatherError,
        userLocation,
        isGpsLocked,
        locating,
        locateMe,
        searchLocation,
        clearMyLocation,
        checklist,
        toggleChecklistItem,
        soundEnabled,
        toggleSound,
        messages,
        isAiThinking,
        sendChatMessage,
        isSpeaking,
        speakText,
        stopSpeaking,
        t,
        askAssistantDirectly,
        themeId,
        setThemeId,
        reduceEffects,
        setReduceEffects,
        reduceMotion,
        setReduceMotion,
        avatarUrl,
        updateAvatar,
        displayName,
        updateDisplayName,
        isSavingProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
