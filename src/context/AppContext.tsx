import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language, RiskLevel, ShelterInfo, ScenarioData, ChatMessage, LiveWeather } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { TRANSLATIONS } from '../data/translations';
import { fetchLiveWeather, geocodeLocationQuery, hasWeatherKey } from '../services/weather';
import { buildLiveScenario, fetchNearbyRealShelters } from '../services/liveRiskEngine';
import { askSafetyAi } from '../services/safetyAi';

import { useAuth } from './AuthContext';
import { DEFAULT_THEME_ID, getThemeById, applyTheme } from '../data/themes';
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

const DEFAULT_MY_COORDS = { lat: 3.139, lon: 101.6869 }; // Kuala Lumpur / Klang Valley center

const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const [activeTab, setActiveTab] = useState<AppTab>('status');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Live GPS & Location Coordinates
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(() => {
    try {
      const raw = localStorage.getItem('terra_guard_live_coords');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isGpsLocked, setIsGpsLocked] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('terra_guard_live_coords'));
    } catch {
      return false;
    }
  });
  const [locating, setLocating] = useState(false);

  // Live weather + Malaysian IPU + Live Shelters -> Dynamic Real-Life Scenario
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [liveShelters, setLiveShelters] = useState<ShelterInfo[]>(SCENARIOS.safe.shelters);
  const [liveScenario, setLiveScenario] = useState<ScenarioData>(() => ({
    ...SCENARIOS.safe,
    locationName: 'Kuala Lumpur',
    locationArea: 'Wilayah Persekutuan, Malaysia',
    lat: DEFAULT_MY_COORDS.lat,
    lon: DEFAULT_MY_COORDS.lon,
    isLive: true
  }));

  const currentScenario = liveScenario;
  const [selectedShelter, setSelectedShelter] = useState<ShelterInfo>(currentScenario.shelters[0]);

  useEffect(() => {
    if (currentScenario.shelters.length > 0) {
      setSelectedShelter(currentScenario.shelters[0]);
    }
  }, [currentScenario.nearestShelterId, currentScenario.lat, currentScenario.lon]);

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
    if (!('geolocation' in navigator)) {
      setWeatherError('Geolocation not supported on this device');
      return;
    }
    setLocating(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(coords);
        setIsGpsLocked(true);
        try {
          localStorage.setItem('terra_guard_live_coords', JSON.stringify(coords));
        } catch {
          // ignore
        }
        setLocating(false);
        playChime();
        void loadWeatherAndRisk(coords);
      },
      err => {
        setWeatherError(
          language === 'bm'
            ? `Akses GPS ditolak (${err.message}). Sila benarkan kebenaran lokasi pada pelayar anda atau cari nama bandar.`
            : `GPS access unavailable (${err.message}). Please allow browser location permission or search a town name.`
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, [language, loadWeatherAndRisk]);

  // Automatically attempt live geolocation on first visit if no coordinates saved yet
  useEffect(() => {
    if (!userLocation && 'geolocation' in navigator) {
      locateMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchLocation = async (query: string): Promise<boolean> => {
    setLocating(true);
    setWeatherError(null);
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
        localStorage.setItem('terra_guard_live_coords', JSON.stringify(coords));
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
    setUserLocation(null);
    setIsGpsLocked(false);
    try {
      localStorage.removeItem('terra_guard_live_coords');
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
    setIsAiThinking(true);

    const reply = await askSafetyAi(trimmed, {
      language,
      scenario: currentScenario,
      selectedShelter,
      weather,
      userLocation: activeCoords
    });

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      sender: 'assistant',
      text: reply.title,
      verificationSummary: reply.verificationSummary,
      sourcesChecked: reply.sourcesChecked,
      steps: reply.steps,
      suggestions: reply.suggestions,
      source: reply.source,
      timestamp: formatNow()
    };

    setIsAiThinking(false);
    setMessages(prev => [...prev, assistantMsg]);
    playChime();
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

    void sendChatMessage(userPrompt);
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = language === 'bm' ? 'ms-MY' : 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const t = TRANSLATIONS[language];

  // ─── Theme & Appearance Management ──────────────────────────────────────────
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      return localStorage.getItem('terra_guard_theme') || DEFAULT_THEME_ID;
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
