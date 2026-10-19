import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language, RiskLevel, ShelterInfo, ScenarioData, ChatMessage, LiveWeather } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { TRANSLATIONS } from '../data/translations';
import { fetchLiveWeather, hasWeatherKey } from '../services/weather';
import { askSafetyAi } from '../services/safetyAi';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  scenario: RiskLevel;
  setScenario: (scenario: RiskLevel) => void;
  activeTab: 'status' | 'map' | 'assistant' | 'sos';
  setActiveTab: (tab: 'status' | 'map' | 'assistant' | 'sos') => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [scenario, setScenario] = useState<RiskLevel>('advisory');
  const [activeTab, setActiveTab] = useState<'status' | 'map' | 'assistant' | 'sos'>('status');
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
        askAssistantDirectly
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
