# Terra Guard V2 🇲🇾 — Citizen Disaster Companion

> **Mobile-first, cognitive-de-escalation disaster monitoring and safety companion for everyday citizens.**

**Terra Guard V2** is a complete civilian reimagining of the original *Terra Guard* concept. Unlike tactical command-center dashboards built for operators, **Terra Guard V2** is engineered for an ordinary person in acute distress asking:
1. *Am I safe right now?*
2. *What do I need to do this exact second?*
3. *Where is the nearest safe shelter?*

---

## ✨ Key Features

- **⚡ Split-Second Risk Status**: Color/icon-based alert tiers (*All Clear*, *Flash Flood Advisory*, *Critical Evacuation Directive*) with plain-language instructions — zero confusing gauges or radar telemetry.
- **🗺️ Expansive Live Map**: Clean vector map displaying your live GPS location, real-time hazard polygons (with water depth readings), and open relief centers (PPS) with capacity meters and walking navigation routes.
- **🤖 Zero-Typing AI Safety Assistant**: 1-tap pre-composed triage chips based on verified National Civil Defence (APM / NADMA / Bomba) protocols, with integrated **Web Speech API ("Read Aloud")** for hands-free audio guidance while moving.
- **🎒 72-Hour Offline Survival Kit & Hotlines**: 100% offline checklist with local storage persistence and 1-tap direct dials to MERS 999, Bomba Dan Penyelamat, APM, and JKM Disaster Relief.
- **🌐 Bilingual (EN / BM)**: Full instant toggle between English and Bahasa Melayu for all directives, checklists, and AI prompts.
- **📱 Responsive & Ergonomic**: Desktop dashboard view (960px) + mobile-first thumb-reachable navigation.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS Design System (clean light mode, custom design tokens, zero Tailwind dependencies)
- **Icons**: Lucide React
- **Audio / Speech**: Web Audio API (tactile alert chimes) + Web Speech API (text-to-speech)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/airilakio29/terra-guard-v2.git
cd terra-guard-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Build Production Bundle
```bash
npm run build
```

---

## 🧪 Evaluator Demo Scenarios

Use the top selector bar to simulate real-world conditions:
- **Subang (Advisory)**: 0.6m rising water along Persiaran Kewajipan underpass with shelter routing to Dewan MPSJ USJ 7.
- **Kelantan (Danger)**: Critical river overflow (1.4m depth) with immediate evacuation directives to SMK Sultan Ibrahim.
- **Penang (Safe)**: All-clear baseline with 72-hour survival kit preparedness.

---

## 📄 License
MIT
