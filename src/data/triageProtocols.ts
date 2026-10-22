import type { Language, ScenarioData, ShelterInfo } from '../types';

export interface VerifiedProtocolStep {
  text: string;
}

export interface VerifiedProtocolReply {
  key: 'pack' | 'drive' | 'power' | 'trapped' | 'shelter' | 'hotline' | 'general';
  titleEn: string;
  titleBm: string;
  summaryEn: string;
  summaryBm: string;
  stepsEn: string[];
  stepsBm: string[];
  suggestionsEn: string[];
  suggestionsBm: string[];
  hotlines: { name: string; number: string; purposeEn: string; purposeBm: string }[];
  sourcesChecked: string[];
}

export const VERIFIED_EMERGENCY_HOTLINES = [
  { name: 'MERS 999', number: '999', purposeEn: 'Police, Ambulance & General Emergency', purposeBm: 'Polis, Ambulans & Kecemasan Am' },
  { name: 'Bomba & Penyelamat', number: '994', purposeEn: 'Flood Evacuation & Water Rescue', purposeBm: 'Penyelamat Banjir & Bot Penyelamat' },
  { name: 'APM Pertahanan Awam', number: '+60380518888', purposeEn: 'Civil Defence Disaster Operations', purposeBm: 'Bilik Gerakan Bencana Pertahanan Awam' },
  { name: 'Talian Kasih JKM', number: '15999', purposeEn: 'Welfare, Food & Shelter Relief', purposeBm: 'Bantuan Kebajikan & Penempatan PPS' }
];

export const VERIFIED_TRIAGE_PROTOCOLS: Record<string, VerifiedProtocolReply> = {
  pack: {
    key: 'pack',
    titleEn: '3-Minute Fast Evacuation Packing Protocol (NADMA)',
    titleBm: 'Senarai Semak Pantas 3-Minit Sebelum Berpindah (NADMA)',
    summaryEn: 'Grab essential life-support items in under 3 minutes. Keep hands free with a backpack.',
    summaryBm: 'Capai barangan penting bawah 3 minit. Gunakan beg galas agar kedua-dua tangan bebas bergerak.',
    stepsEn: [
      '1. Identification & Official Documents: Place IC (MyKad), passports, birth certs, and land/car grants inside a sealed waterproof ziplock pouch.',
      '2. Critical Medications & Infant Supplies: Take at least 5 days of prescribed chronic medications (insulin, blood pressure), baby formula, and diapers.',
      '3. Power & Communications: Pack your mobile phone, fully-charged powerbank, and charging cable. Activate Ultra Power-Saving mode.',
      '4. Protective Footwear: Put on closed sturdy shoes (never slippers or barefoot due to glass shards, nails, and hidden drain pits).',
      '5. Small Cash & Emergency Light: Pack Ringgit cash in small denominations (ATMs and card terminals may suffer power failure) and a waterproof torchlight.'
    ],
    stepsBm: [
      '1. Dokumen Pengenalan: Masukkan MyKad, pasport, sijil lahir, dan geran ke dalam beg plastik kedap air (ziplock) serta-merta.',
      '2. Bekalan Ubat Khas & Bayi: Ambil bekalan ubat kronik sekurang-kurangnya 5 hari (insulin, darah tinggi), susu formula bayi, dan lampin.',
      '3. Komunikasi & Kuasa: Bawa telefon bimbit, powerbank bercas penuh, dan kabel. Aktifkan mod Penjimatan Kuasa Ekstrem.',
      '4. Kasut Bertutup Kukuh: Pakai kasut bertutup (jangan sesekali berkaki ayam atau berselipar kerana serpihan kaca dan jerangkap longkang).',
      '5. Wang Tunai Kecil & Lampu Suluh: Sediakan wang tunai not kecil (mesin ATM dan terminal kad terputus akibat gangguan bekalan elektrik) dan lampu suluh.'
    ],
    suggestionsEn: ['Should I switch off the main breaker?', 'Can I drive my car through water?'],
    suggestionsBm: ['Perlukah saya tutup suis utama elektrik?', 'Bolehkah saya pandu kereta redah air?'],
    hotlines: VERIFIED_EMERGENCY_HOTLINES,
    sourcesChecked: ['NADMA 72-Hour Survival Kit SOP', 'Civil Defence Evacuation Guidelines']
  },

  drive: {
    key: 'drive',
    titleEn: 'Turn Around, Don’t Drown — Vehicle Flood Safety (Bomba)',
    titleBm: 'JANGAN Pandu Redah Air Banjir — Keselamatan Kenderaan (Bomba)',
    summaryEn: 'Moving floodwaters possess tremendous force. Most flood deaths in Malaysia occur inside submerged vehicles.',
    summaryBm: 'Arus banjir memiliki daya tolakan kuat. Kebanyakan kemalangan maut banjir di Malaysia melibatkan mangsa dalam kenderaan.',
    stepsEn: [
      '1. 15 cm (6 inches) of water reaches the chassis of most passenger sedans, causing engine stalling via air-intake hydrolock and brake failure.',
      '2. 30 cm (12 inches) of moving floodwater floats passenger cars and sweeps them off roadways into deep monsoon drains or retention ponds.',
      '3. 60 cm (2 feet) of rushing water will carry away heavy four-wheel-drive trucks, SUVs, and commercial vans.',
      '4. Hidden Death Traps: Floodwaters conceal missing manhole covers, dislodged culverts, washed-out road bridges, and submerged sinkholes.',
      '5. Stalled Vehicle Protocol: If your vehicle stalls in rising water, abandon the car immediately, climb out, and move to higher ground on foot.'
    ],
    stepsBm: [
      '1. Air setinggi 15 cm (6 inci) sahaja sudah mencecah casis kereta, menyebabkan enjin mati mendadak (hydrolock) dan kegagalan brek.',
      '2. Air setinggi 30 cm (1 kaki) yang mengalir berupaya mengapungkan kereta sedan lalu menghanyutkannya ke longkang monsun atau kolam takungan.',
      '3. Air setinggi 60 cm (2 kaki) yang deras berupaya menghanyutkan kenderaan pacuan 4 roda (4WD) dan lori sederhana.',
      '4. Bahaya Tersembunyi: Permukaan air menutup penutup longkang yang tercabut, tebing jalan yang runtuh, dan lubang jerangkap maut.',
      '5. Tindakan Jika Kereta Mati: Jika enjin mati dalam air yang kian naik, keluar dari kenderaan serta-merta dan bergerak ke tempat selamat di darat tinggi.'
    ],
    suggestionsEn: ['What if water enters my house?', 'View Nearest Open Shelter'],
    suggestionsBm: ['Apa tindakan jika air masuk rumah?', 'Lihat Pusat Pemindahan Terdekat'],
    hotlines: [VERIFIED_EMERGENCY_HOTLINES[1], VERIFIED_EMERGENCY_HOTLINES[0]],
    sourcesChecked: ['Jabatan Bomba & Penyelamat Malaysia Road Safety SOP', 'NADMA Vehicle Protocol']
  },

  power: {
    key: 'power',
    titleEn: 'Electrical Safety During Rising Water (TNB & Suruhanjaya Tenaga)',
    titleBm: 'Keselamatan Elektrik Semasa Banjir (TNB & Suruhanjaya Tenaga)',
    summaryEn: 'Electrocution is an invisible killer during indoor floods. Cut power before water touches outlets.',
    summaryBm: 'Renjatan elektrik adalah ancaman maut tidak kelihatan. Putuskan bekalan sebelum air mencecah suis.',
    stepsEn: [
      '1. Switch OFF the main Distribution Board (MCB / fuse box breaker) BEFORE water reaches floor-level power outlets.',
      '2. Never touch electrical switches, plugs, or distribution panels if you are standing in water or if your hands are wet.',
      '3. Unplug heavy high-voltage appliances (refrigerator, washing machine, television) and elevate them above expected flood level if safe.',
      '4. Submerged Hazards: Treat all floodwater near electrical posts, street lamps, or sagging cables as electrically live. Maintain 10m clearance.',
      '5. Post-Flood Warning: Do NOT turn on the main breaker after floodwaters recede until wiring has been thoroughly inspected by a certified wireman.'
    ],
    stepsBm: [
      '1. Matikan Suis Utama (MCB / Peti Agihan Fius) SEBELUM paras air mencecah paras soket elektrik di dinding atau lantai.',
      '2. Jangan sekali-kali menyentuh suis atau perkakasan elektrik sekiranya anda berdiri di dalam air atau tangan dalam keadaan basah.',
      '3. Cabut palam peralatan berkuasa tinggi (peti ais, mesin basuh, TV) dan letakkan di tempat tinggi sekiranya sempat dan selamat.',
      '4. Bahaya Wayar & Tiang: Anggap semua air bertakung berdekatan tiang lampu atau pencawang TNB berarus elektrik. Jauhi sekurang-kurangnya 10 meter.',
      '5. Amaran Pasca-Banjir: Jangan hidupkan semula suis utama selepas air surut sehingga pemeriksaan disahkan oleh pendawai bertauliah.'
    ],
    suggestionsEn: ['What to pack right now?', 'What if water enters my house?'],
    suggestionsBm: ['Apa yang patut saya kemas sekarang?', 'Apa tindakan jika air masuk rumah?'],
    hotlines: [
      { name: 'TNB Careline', number: '15454', purposeEn: 'Emergency Power Cutoff & Downed Cables', purposeBm: 'Putus Bekalan Kecemasan & Wayar Putus' },
      VERIFIED_EMERGENCY_HOTLINES[1],
      VERIFIED_EMERGENCY_HOTLINES[0]
    ],
    sourcesChecked: ['Suruhanjaya Tenaga Malaysia Safety Code', 'TNB Flood Safety Protocol']
  },

  trapped: {
    key: 'trapped',
    titleEn: 'Indoor Flood Trap & High-Ground SOP (NADMA & APM)',
    titleBm: 'Protokol Jika Air Masuk & Terperangkap (NADMA & APM)',
    summaryEn: 'Protect family members and signal rescuers immediately. Never trap yourself in a closed attic.',
    summaryBm: 'Selamatkan ahli keluarga ke tempat tinggi dan beri isyarat kepada penyelamat serta-merta.',
    stepsEn: [
      '1. Move to Higher Ground: Evacuate children, the elderly, sick persons, and pets to the 2nd floor or roof platform immediately.',
      '2. Attic Warning: Do NOT climb into a closed attic/ceiling space unless it has an openable roof hatch or exit — rising water can trap you fatally.',
      '3. Call Rescue Dispatch: Dial MERS 999 or Bomba (994). Clearly state: street name, exact house number, GPS location, number of occupants, and water depth.',
      '4. Visual & Audio Signals: Hang a bright white or orange towel from an upper window or balcony, use an emergency whistle, or flash a phone torchlight.',
      '5. Sanitation & Water: Do NOT drink tap water or floodwater under any circumstance. Drink only sealed bottled water.'
    ],
    stepsBm: [
      '1. Berpindah ke Tingkat Atas: Bawa kanak-kanak, warga emas, pesakit, dan haiwan peliharaan ke tingkat 2 atau struktur paling tinggi.',
      '2. Amaran Siling: JANGAN panjat ke siling tertutup tanpa laluan keluar ke bumbung — anda boleh terperangkap sekiranya air naik mencecah siling.',
      '3. Hubungi Pasukan Penyelamat: Dail MERS 999 atau Bomba (994). Nyatakan: nama jalan, nombor rumah, koordinat GPS, bilangan mangsa, dan ketinggian air.',
      '4. Beri Isyarat Penyelamat: Gantung kain putih/oren terang dari tingkap atas, tiup wisel kecemasan, atau suluh lampu telefon pada waktu malam.',
      '5. Kebersihan Minuman: Jangan minum air banjir atau air paip yang tercemar. Minum hanya air botol bertutup rapat.'
    ],
    suggestionsEn: ['Emergency SOS Hotline', 'What to pack right now?'],
    suggestionsBm: ['Talian Kecemasan Terus SOS', 'Apa yang patut saya kemas sekarang?'],
    hotlines: VERIFIED_EMERGENCY_HOTLINES,
    sourcesChecked: ['NADMA Search & Rescue SOP', 'APM Special Disaster Guidelines']
  }
};

/**
 * Enriches the protocol reply with the active scenario's actual nearest shelter details.
 * Ensures the assistant NEVER hallucinates shelter names or routes.
 */
export function buildEnrichedTriageReply(
  key: 'pack' | 'drive' | 'power' | 'trapped',
  lang: Language,
  scenario: ScenarioData,
  selectedShelter: ShelterInfo
) {
  const base = VERIFIED_TRIAGE_PROTOCOLS[key] || VERIFIED_TRIAGE_PROTOCOLS.pack;
  const isBm = lang === 'bm';

  const shelterLineEn = `Official Evacuation Point for ${scenario.locationName}: ${selectedShelter.name} (${selectedShelter.distanceKm} km, ~${selectedShelter.walkMinutes} min walk, Capacity: ${selectedShelter.capacityCurrent}/${selectedShelter.capacityTotal} at ${selectedShelter.address}).`;
  const shelterLineBm = `Pusat Pemindahan Rasmi (PPS) kawasan ${scenario.locationName}: ${selectedShelter.nameBm || selectedShelter.name} (${selectedShelter.distanceKm} km, ~${selectedShelter.walkMinutes} min jalan kaki, Kapasiti: ${selectedShelter.capacityCurrent}/${selectedShelter.capacityTotal} di ${selectedShelter.address}).`;

  const steps = isBm ? [...base.stepsBm] : [...base.stepsEn];
  steps.push(isBm ? shelterLineBm : shelterLineEn);

  return {
    title: isBm ? base.titleBm : base.titleEn,
    verificationSummary: isBm ? base.summaryBm : base.summaryEn,
    steps,
    suggestions: isBm ? base.suggestionsBm : base.suggestionsEn,
    hotlines: base.hotlines,
    sourcesChecked: base.sourcesChecked,
    source: 'offline' as const
  };
}

/**
 * Fast detection of triage chip keywords for instant local execution with 0 model calls.
 */
export function detectTriageIntent(text: string): 'pack' | 'drive' | 'power' | 'trapped' | null {
  const lower = text.toLowerCase().trim();

  // 1. Pack / checklist
  if (/\b(pack|kemas|bag|beg|barang|dokumen|mykad|bawa|keperluan|bekalan|checklist)\b/.test(lower)) {
    return 'pack';
  }
  // 2. Drive / car
  if (/\b(drive|pandu|car|kereta|redah|kenderaan|jalan|motor|harung|arung|harungi)\b/.test(lower)) {
    return 'drive';
  }
  // 3. Power / electricity
  if (/\b(power|elektrik|suis|breaker|mcb|plug|soket|tenaga|tnb|fuse|fius|renjatan)\b/.test(lower)) {
    return 'power';
  }
  // 4. Trapped / water entering
  if (/\b(trap|terperangkap|house|rumah|masuk|rising|naik|bumbung|roof|banjir kilat|lemas|selamat)\b/.test(lower)) {
    return 'trapped';
  }

  return null;
}
