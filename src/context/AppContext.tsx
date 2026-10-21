import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language, RiskLevel, ShelterInfo, ScenarioData, ChatMessage, LiveWeather } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { TRANSLATIONS } from '../data/translations';
import { fetchLiveWeather, hasWeatherKey } from '../services/weather';
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
  locating: boolean;
  locateMe: () => void;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest, userProfile } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('terra_guard_lang');
      return (saved === 'bm' || saved === 'en') ? saved : 'en';
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
  const [scenario, setScenario] = useState<RiskLevel>('advisory');
  const [activeTab, setActiveTab] = useState<AppTab>('status');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const currentScenario = SCENARIOS[scenario];
  const [selectedShelter, setSelectedShelter] = useState<ShelterInfo>(
    currentScenario.shelters[0]
  );

  // Keep selected shelter updated when scenario switches
  useEffect(() => {
    setSelectedShelter(currentScenario.shelters[0]);
  }, [currentScenario]);

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

  // ---------- Live weather (OpenWeatherMap) ----------
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const weatherCoords = userLocation ?? { lat: currentScenario.lat, lon: currentScenario.lon };

  const loadWeather = useCallback(async () => {
    if (!hasWeatherKey()) {
      setWeatherError('missing-key');
      return;
    }
    try {
      const w = await fetchLiveWeather(weatherCoords.lat, weatherCoords.lon, language);
      setWeather(w);
      setWeatherError(null);
    } catch (e) {
      setWeatherError(e instanceof Error ? e.message : 'Weather unavailable');
    }
  }, [weatherCoords.lat, weatherCoords.lon, language]);

  useEffect(() => {
    loadWeather();
    const id = window.setInterval(loadWeather, 10 * 60 * 1000); // every 10 min
    return () => window.clearInterval(id);
  }, [loadWeather]);

  const locateMe = () => {
    if (!('geolocation' in navigator)) {
      setWeatherError('Geolocation not supported on this device');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      err => {
        setWeatherError(err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearMyLocation = () => setUserLocation(null);

  const refreshFeeds = async () => {
    setIsRefreshing(true);
    playChime();
    await loadWeather();
    setIsRefreshing(false);
  };

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: language === 'bm' 
        ? 'Selamat datang ke Bantuan Keselamatan Terra Guard V2. Pilih topik atau tanya sebarang panduan kecemasan.'
        : 'Welcome to Terra Guard V2 Safety Assistant. Select a topic below or ask any emergency question.',
      timestamp: 'Just now',
      suggestions: language === 'bm'
        ? ['Apa patut dikemas?', 'Boleh pandu kereta redah air?', 'Keselamatan elektrik']
        : ['What to pack right now?', 'Can I drive through water?', 'Electrical safety']
    }
  ]);

  // Handle language switch for the initial message if unmodified
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'm-init') {
        return [
          {
            id: 'm-init',
            sender: 'assistant',
            text: language === 'bm' 
              ? 'Selamat datang ke Bantuan Keselamatan Terra Guard V2. Pilih topik atau tanya sebarang panduan kecemasan.'
              : 'Welcome to Terra Guard V2 Safety Assistant. Select a topic below or ask any emergency question.',
            timestamp: 'Just now',
            suggestions: language === 'bm'
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

    // Handle quick-action navigation chips if clicked
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
      userLocation
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
    const userPrompt = promptKey === 'pack'
      ? (language === 'bm' ? 'Apa yang patut saya kemas sekarang?' : 'What should I pack right now?')
      : promptKey === 'drive'
      ? (language === 'bm' ? 'Bolehkah saya pandu kereta redah air?' : 'Can I drive through water?')
      : promptKey === 'power'
      ? (language === 'bm' ? 'Perlukah tutup suis utama elektrik?' : 'Should I switch off the main breaker?')
      : (language === 'bm' ? 'Apa tindakan jika air masuk rumah?' : 'What if water enters my house?');

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

  // Apply visual theme to document root whenever themeId or visual overrides change
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
      updateDoc(doc(db, 'users', user.uid), { themeId: newId }).catch((err) => {
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

  // Synchronize when auth userProfile resolves from Firestore
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
        locating,
        locateMe,
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
