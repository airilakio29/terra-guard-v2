import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Bot, 
  User, 
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssistantScreen: React.FC = () => {
  const { 
    messages, 
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
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput('');
  };

  const handleChipClick = (suggestion: string) => {
    sendChatMessage(suggestion);
  };

  const handleToggleSpeech = (msgText: string, steps?: string[]) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const fullSpeech = steps ? `${msgText}. ${steps.join('. ')}` : msgText;
      speakText(fullSpeech);
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', opacity: 0.8, fontSize: '11px' }}>
                {isUser ? <User size={12} /> : <Bot size={12} />}
                <span>{isUser ? 'You' : 'Civil Defence Safety AI'}</span>
                <span>• {m.timestamp}</span>
              </div>

              <div style={{ fontWeight: isUser ? 500 : 700, fontSize: '14px' }}>
                {m.text}
              </div>

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
                  onClick={() => handleToggleSpeech(m.text, m.steps)}
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
          disabled={!input.trim()}
          title={t.send}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
