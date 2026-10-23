import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Bot, 
  User, 
  ArrowRight,
  Sparkles,
  PhoneCall,
  RotateCcw,
  Package,
  Car,
  Zap,
  Home
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssistantScreen: React.FC = () => {
  const { 
    language,
    messages, 
    isAiThinking,
    sendChatMessage, 
    askAssistantDirectly,
    isSpeaking, 
    speakText, 
    stopSpeaking, 
    t 
  } = useApp();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiThinking) return;
    sendChatMessage(input);
    setInput('');
  };

  const handleChipClick = (suggestion: string) => {
    if (isAiThinking) return;
    sendChatMessage(suggestion);
  };

  const handleToggleSpeech = (msgText: string, verificationSummary?: string, steps?: string[]) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const parts = [msgText, verificationSummary, ...(steps ?? [])].filter(Boolean);
      speakText(parts.join('. '));
    }
  };

  return (
    <div className="screen-scroll-container assistant-container">
      {/* Official Guidelines Disclaimer */}
      <div className="assistant-disclaimer">
        <ShieldCheck size={16} />
        <span>{t.verifiedCivilDefence}</span>
      </div>

      {/* 1-Tap Triage Fast Bar (Instant <100ms verified response) */}
      <div className="triage-quick-strip">
        <button 
          className="triage-quick-btn"
          onClick={() => askAssistantDirectly('pack')}
        >
          <Package size={13} />
          <span>{language === 'bm' ? 'Kemas (3 Minit)' : 'What to pack?'}</span>
        </button>

        <button 
          className="triage-quick-btn"
          onClick={() => askAssistantDirectly('drive')}
        >
          <Car size={13} />
          <span>{language === 'bm' ? 'Pandu redah air?' : 'Can I drive?'}</span>
        </button>

        <button 
          className="triage-quick-btn"
          onClick={() => askAssistantDirectly('power')}
        >
          <Zap size={13} />
          <span>{language === 'bm' ? 'Tutup suis elektrik?' : 'Shut off breaker?'}</span>
        </button>

        <button 
          className="triage-quick-btn"
          onClick={() => askAssistantDirectly('trapped')}
        >
          <Home size={13} />
          <span>{language === 'bm' ? 'Air masuk rumah?' : 'Water entering?'}</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="chat-message-list">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div 
              key={m.id} 
              className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant chat-bubble--reveal'}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', opacity: 0.85, fontSize: '11px', flexWrap: 'wrap' }}>
                {isUser ? <User size={12} /> : <Bot size={12} />}
                <span>{isUser ? (language === 'bm' ? 'Anda' : 'You') : 'Civil Defence Safety AI'}</span>
                <span>• {m.timestamp}</span>
                {!isUser && m.source && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: m.source === 'gemini' ? 'var(--brand-surface)' : 'var(--bg-subtle)',
                      color: m.source === 'gemini' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    <Sparkles size={10} />
                    {m.source === 'gemini'
                      ? (language === 'bm' ? 'Disahkan Gemini AI (Pantas)' : 'Verified by Gemini AI (Fast)')
                      : (language === 'bm' ? 'Protokol Sah Pertahanan Awam' : 'Verified Civil Defence Protocol')}
                  </span>
                )}
              </div>

              <div style={{ fontWeight: isUser ? 500 : 700, fontSize: '14px', lineHeight: 1.45 }}>
                {m.text}
                {m.isStreaming && <span className="streaming-cursor" />}
              </div>

              {/* Verified Civil Defence / Telemetry Summary Box */}
              {!isUser && (m.verificationSummary || (m.sourcesChecked && m.sourcesChecked.length > 0)) && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-none)',
                    background: 'var(--brand-surface)',
                    border: '1px solid var(--brand-border)',
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', color: 'var(--brand-primary)' }}>
                    <ShieldCheck size={14} />
                    <span>
                      {language === 'bm'
                        ? 'Pengesahan Protokol Rasmi & Telemetri:'
                        : 'Official Protocol & Telemetry Verification:'}
                    </span>
                  </div>
                  {m.verificationSummary && (
                    <div style={{ lineHeight: 1.45 }}>{m.verificationSummary}</div>
                  )}
                  {m.sourcesChecked && m.sourcesChecked.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {m.sourcesChecked.map((src, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            background: 'var(--bg-surface)',
                            color: 'var(--brand-hover)',
                            border: '1px solid var(--brand-border)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)'
                          }}
                        >
                          ✓ {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Numbered Steps */}
              {m.steps && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {m.steps.map((step, idx) => (
                    <div key={idx} className="chat-step-item">
                      {step}
                    </div>
                  ))}
                </div>
              )}

              {/* Verified Emergency Hotlines Direct Dial Strip */}
              {!isUser && m.hotlines && m.hotlines.length > 0 && (
                <div className="chat-hotlines-box">
                  <div className="chat-hotlines-title">
                    <PhoneCall size={12} />
                    <span>
                      {language === 'bm'
                        ? 'Talian Kecemasan Terus (24 Jam):'
                        : 'Verified Emergency Direct Dial (24 Hours):'}
                    </span>
                  </div>
                  <div className="chat-hotlines-grid">
                    {m.hotlines.map((h, hIdx) => (
                      <a 
                        key={hIdx}
                        href={`tel:${h.number}`}
                        className="chat-hotline-pill"
                        title={language === 'bm' ? h.purposeBm : h.purposeEn}
                      >
                        <span className="chat-hotline-number">{h.name}: {h.number}</span>
                        <span style={{ fontSize: '9px', opacity: 0.8, fontWeight: 500 }}>
                          {language === 'bm' ? h.purposeBm : h.purposeEn}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Graceful Fallback Retry Button */}
              {!isUser && m.canRetry && m.retryPrompt && (
                <div>
                  <button 
                    className="chat-retry-btn"
                    onClick={() => m.retryPrompt && sendChatMessage(m.retryPrompt)}
                  >
                    <RotateCcw size={12} />
                    <span>{language === 'bm' ? 'Cuba Semula' : 'Retry'}</span>
                  </button>
                </div>
              )}

              {/* Read Aloud Button for Hands-Free Mobility */}
              {!isUser && !m.isStreaming && (
                <button 
                  className={`chat-audio-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={() => handleToggleSpeech(m.text, m.verificationSummary, m.steps)}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX size={14} />
                      <span>{t.stopAudio}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} />
                      <span>{t.readAloud}</span>
                    </>
                  )}
                </button>
              )}

              {/* Follow-up Suggestions Chips */}
              {m.suggestions && !m.isStreaming && (
                <div className="chat-suggestions">
                  {m.suggestions.map((sug, i) => (
                    <button 
                      key={i} 
                      className="chat-suggestion-chip"
                      onClick={() => handleChipClick(sug)}
                      disabled={isAiThinking}
                    >
                      <ArrowRight size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Ultra-Fast Typing Indicator within 100ms */}
        {isAiThinking && (
          <div className="chat-bubble chat-bubble--assistant" style={{ padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="typing-dots-container">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {language === 'bm'
                  ? 'Menyemak panduan keselamatan...'
                  : 'Checking safety protocols...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder={t.askInputPlaceholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={!input.trim() || isAiThinking}
          title={t.send}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
