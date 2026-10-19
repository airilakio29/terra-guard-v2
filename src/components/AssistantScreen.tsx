import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Bot, 
  User, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssistantScreen: React.FC = () => {
  const { 
    language,
    messages, 
    isAiThinking,
    sendChatMessage, 
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

      {/* Messages Feed */}
      <div className="chat-message-list">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div 
              key={m.id} 
              className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}
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
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: m.source === 'gemini' ? '#E0F2FE' : '#F1F5F9',
                      color: m.source === 'gemini' ? '#0369A1' : '#475569'
                    }}
                  >
                    <Sparkles size={10} />
                    {m.source === 'gemini'
                      ? (language === 'bm' ? 'Disahkan Gemini AI' : 'Verified by Gemini AI')
                      : (language === 'bm' ? 'Protokol Luar Talian' : 'Offline Protocol')}
                  </span>
                )}
              </div>

              <div style={{ fontWeight: isUser ? 500 : 700, fontSize: '14px' }}>
                {m.text}
              </div>

              {/* Verified Deep-Research Summary Box */}
              {!isUser && (m.verificationSummary || (m.sourcesChecked && m.sourcesChecked.length > 0)) && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    fontSize: '12px',
                    color: '#0C4A6E'
                  }}
                >
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', color: '#0369A1' }}>
                    <ShieldCheck size={14} />
                    <span>
                      {language === 'bm'
                        ? 'Semakan Data & Pengesahan Masa Nyata:'
                        : 'Live Research & Telemetry Verification:'}
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
                            background: '#E0F2FE',
                            color: '#075985',
                            padding: '2px 6px',
                            borderRadius: '4px'
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

              {/* Read Aloud Button for Hands-Free Mobility */}
              {!isUser && (
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
              {m.suggestions && (
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

        {isAiThinking && (
          <div className="chat-bubble chat-bubble--assistant" style={{ opacity: 0.92 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0284C7' }}>
                <Sparkles size={14} className="spin-icon" />
                <span>
                  {language === 'bm'
                    ? 'Menjalankan semakan mendalam (Deep Research)...'
                    : 'Running multi-source Deep Research & Verification...'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', paddingLeft: '20px' }}>
                {language === 'bm'
                  ? '• Menyemak radar hujan OpenWeather, luahan sungai satelit Copernicus GloFAS & protokol NADMA/JPS'
                  : '• Checking OpenWeather rainfall radar, Copernicus GloFAS river discharge & NADMA/JPS protocols'}
              </div>
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
