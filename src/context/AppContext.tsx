import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language, RiskLevel, ShelterInfo, ScenarioData, ChatMessage } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { TRANSLATIONS, AI_KNOWLEDGE_BASE } from '../data/translations';

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
  checklist: Record<string, boolean>;
  toggleChecklistItem: (id: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  messages: ChatMessage[];
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

  const currentScenario = SCENARIOS[scenario];
  const [selectedShelter, setSelectedShelter] = useState<ShelterInfo>(
    currentScenario.shelters[0]
  );

  // Keep selected shelter updated when scenario switches
  useEffect(() => {
    setSelectedShelter(currentScenario.shelters[0]);
  }, [scenario]);

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

  const refreshFeeds = () => {
    setIsRefreshing(true);
    playChime();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: language === 'bm' 
        ? 'Selamat datang ke Bantuan Keselamatan AmanAlert. Pilih topik atau tanya sebarang panduan kecemasan.'
        : 'Welcome to AmanAlert Safety Assistant. Select a topic below or ask any emergency question.',
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
              ? 'Selamat datang ke Bantuan Keselamatan AmanAlert. Pilih topik atau tanya sebarang panduan kecemasan.'
              : 'Welcome to AmanAlert Safety Assistant. Select a topic below or ask any emergency question.',
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

  const sendChatMessage = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Now'
    };

    setMessages(prev => [...prev, userMsg]);

    // Match against knowledge base
    const lower = userText.toLowerCase();
    let kbKey: 'pack' | 'drive' | 'power' | 'trapped' = 'pack';

    if (lower.includes('pack') || lower.includes('kemas') || lower.includes('bag') || lower.includes('beg') || lower.includes('barang')) {
      kbKey = 'pack';
    } else if (lower.includes('drive') || lower.includes('car') || lower.includes('pandu') || lower.includes('kereta') || lower.includes('jalan')) {
      kbKey = 'drive';
    } else if (lower.includes('power') || lower.includes('electric') || lower.includes('elektrik') || lower.includes('suis') || lower.includes('fuse')) {
      kbKey = 'power';
    } else if (lower.includes('trap') || lower.includes('perangkap') || lower.includes('enter') || lower.includes('masuk') || lower.includes('rumah')) {
      kbKey = 'trapped';
    }

    const kbItem = AI_KNOWLEDGE_BASE[kbKey][language];

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: kbItem.title,
        steps: kbItem.steps,
        suggestions: kbItem.suggestions,
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, assistantMsg]);
      playChime();
    }, 400);
  };

  const askAssistantDirectly = (promptKey: 'pack' | 'drive' | 'power' | 'trapped') => {
    setActiveTab('assistant');
    const kb = AI_KNOWLEDGE_BASE[promptKey][language];
    const userPrompt = promptKey === 'pack'
      ? (language === 'bm' ? 'Apa yang patut saya kemas sekarang?' : 'What should I pack right now?')
      : promptKey === 'drive'
      ? (language === 'bm' ? 'Bolehkah saya pandu kereta redah air?' : 'Can I drive through water?')
      : promptKey === 'power'
      ? (language === 'bm' ? 'Perlukah tutup suis utama elektrik?' : 'Should I switch off the main breaker?')
      : (language === 'bm' ? 'Apa tindakan jika air masuk rumah?' : 'What if water enters my house?');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: 'Now'
    };

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      sender: 'assistant',
      text: kb.title,
      steps: kb.steps,
      suggestions: kb.suggestions,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    playChime();
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
        checklist,
        toggleChecklistItem,
        soundEnabled,
        toggleSound,
        messages,
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
