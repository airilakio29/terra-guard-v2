import React, { useState } from 'react';
import { 
  Phone, 
  Check, 
  Copy, 
  CheckCheck, 
  ShieldAlert, 
  PackageCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EMERGENCY_CONTACTS, OFFLINE_CHECKLIST_ITEMS } from '../data/scenarios';

export const SosScreen: React.FC = () => {
  const { 
    language, 
    checklist, 
    toggleChecklistItem, 
    t 
  } = useApp();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalItems = OFFLINE_CHECKLIST_ITEMS.length;
  const checkedCount = OFFLINE_CHECKLIST_ITEMS.filter(item => checklist[item.id]).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  const handleCopy = (id: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="screen-scroll-container">
      {/* 1. Direct Emergency Hotlines Section */}
      <div className="section-card" style={{ borderLeft: '4px solid var(--danger-accent)' }}>
        <div className="section-title" style={{ color: 'var(--danger-accent)' }}>
          <ShieldAlert size={18} />
          <span>{t.hotlinesTitle}</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {t.hotlinesSubtitle}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {EMERGENCY_CONTACTS.map((c) => (
            <div 
              key={c.id} 
              className={`hotline-card ${c.isPrimary ? 'primary' : ''}`}
            >
              <div className="hotline-info">
                <span className="hotline-title">
                  {language === 'bm' ? c.titleBm : c.titleEn}
                </span>
                <span className="hotline-desc">
                  {language === 'bm' ? c.descriptionBm : c.descriptionEn}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '2px' }}>
                  {c.number}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handleCopy(c.id, c.number)}
                  title={t.copyNumber}
                  style={{
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {copiedId === c.id ? <CheckCheck size={16} color="var(--safe-accent)" /> : <Copy size={16} color="var(--text-muted)" />}
                </button>

                <a 
                  href={`tel:${c.number.replace(/\s+/g, '')}`} 
                  className="hotline-call-btn"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 72-Hour Evacuation Survival Checklist (100% Offline) */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <PackageCheck size={18} color="var(--brand-primary)" />
            <span>{t.offlineKitTitle}</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)' }}>
            {checkedCount}/{totalItems} {t.itemsPacked}
          </span>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          {t.offlineKitSubtitle}
        </p>

        {/* Progress bar */}
        <div className="capacity-bar-container" style={{ marginBottom: '14px' }}>
          <div 
            className="capacity-bar-fill" 
            style={{ 
              width: `${progressPercent}%`, 
              background: progressPercent === 100 ? 'var(--safe-badge)' : 'var(--brand-primary)' 
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {OFFLINE_CHECKLIST_ITEMS.map((item) => {
            const isChecked = !!checklist[item.id];
            return (
              <div 
                key={item.id} 
                className={`checklist-card ${isChecked ? 'checked' : ''}`}
                onClick={() => toggleChecklistItem(item.id)}
              >
                <div className="checkbox-custom">
                  {isChecked && <Check size={14} className="checkbox-check-icon" />}
                </div>
                <div>
                  <div className="checklist-title">
                    {language === 'bm' ? item.titleBm : item.titleEn}
                  </div>
                  <div className="checklist-subtitle">
                    {language === 'bm' ? item.subtitleBm : item.subtitleEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
