import type { ScenarioData } from '../types';

export const SCENARIOS: Record<string, ScenarioData> = {
  advisory: {
    id: 'advisory',
    locationName: 'Subang Jaya, USJ 1',
    locationArea: 'Petaling District, Selangor',
    riskLevel: 'advisory',
    headlineEn: 'Flash Flood Advisory',
    headlineBm: 'Amaran Banjir Kilat',
    directiveEn: 'Water rising in low-lying sections. Do not drive through flooded roads.',
    directiveBm: 'Air mula naik di kawasan rendah. Jangan pandu melalui laluan berair.',
    hazardSummaryEn: '0.6m water reported along Persiaran Kewajipan underpass. Nearby river at warning threshold.',
    hazardSummaryBm: 'Air setinggi 0.6m dilaporkan di bawah jambatan Persiaran Kewajipan. Paras sungai berdekatan pada tahap amaran.',
    primaryActionEn: 'View Nearest Open Shelter',
    primaryActionBm: 'Lihat Pusat Pemindahan Terdekat',
    primaryActionSubtitleEn: 'Dewan Serbaguna MPSJ (850m away • 11 min walk)',
    primaryActionSubtitleBm: 'Dewan Serbaguna MPSJ (850m • 11 min berjalan)',
    nearestShelterId: 'shelter-subang-1',
    lat: 3.0515,
    lon: 101.5823,
    hazards: [
      {
        id: 'h-1',
        title: 'Flash Flood: Persiaran Kewajipan Underpass',
        titleBm: 'Banjir Kilat: Laluan Bawah Persiaran Kewajipan',
        type: 'flood',
        severity: 'advisory',
        waterDepthMeters: 0.6,
        affectedRoads: ['Persiaran Kewajipan', 'Jalan Subang 1'],
        descriptionEn: 'Passable only for heavy trucks. Light vehicles stranded.',
        descriptionBm: 'Hanya boleh dilalui lori berat. Kenderaan ringan terkandas.',
        coords: { x: 50, y: 46, radius: 18 }
      },
      {
        id: 'h-2',
        title: 'River Level: Sungai Klang Border',
        titleBm: 'Paras Sungai: Sempadan Sungai Klang',
        type: 'flood',
        severity: 'advisory',
        affectedRoads: ['Jalan TP 2'],
        descriptionEn: 'River gauge showing amber warning. Embankment stable.',
        descriptionBm: 'Tolok sungai paras kuning. Tebing sungai masih terkawal.',
        coords: { x: 78, y: 30, radius: 14 }
      }
    ],
    shelters: [
      {
        id: 'shelter-subang-1',
        name: 'Dewan Serbaguna MPSJ USJ 7',
        nameBm: 'Dewan Serbaguna MPSJ USJ 7',
        area: 'USJ 7, Subang Jaya',
        distanceKm: 0.85,
        walkMinutes: 11,
        driveMinutes: 4,
        status: 'open',
        capacityCurrent: 142,
        capacityTotal: 400,
        address: 'Jalan USJ 7/1, 47610 Subang Jaya, Selangor',
        phone: '+603-5621 1188',
        amenities: ['food', 'water', 'medical', 'bedding', 'power'],
        coords: { x: 34, y: 72 }
      },
      {
        id: 'shelter-subang-2',
        name: 'SK Seafield Assembly Hall',
        nameBm: 'Dewan SK Seafield',
        area: 'USJ 2, Subang Jaya',
        distanceKm: 1.6,
        walkMinutes: 20,
        driveMinutes: 6,
        status: 'open',
        capacityCurrent: 60,
        capacityTotal: 250,
        address: 'Persiaran Kewajipan, USJ 2, 47600 Subang Jaya',
        phone: '+603-5634 8922',
        amenities: ['food', 'water', 'power'],
        coords: { x: 25, y: 28 }
      },
      {
        id: 'shelter-subang-3',
        name: 'Kompleks Sukan 3K Subang Jaya',
        nameBm: 'Kompleks Sukan 3K Subang Jaya',
        area: 'SS 13, Subang Jaya',
        distanceKm: 2.8,
        walkMinutes: 38,
        driveMinutes: 9,
        status: 'limited',
        capacityCurrent: 480,
        capacityTotal: 500,
        address: 'Jalan SS 13/1, 47500 Subang Jaya',
        phone: '+603-5636 9233',
        amenities: ['food', 'water', 'medical', 'bedding', 'power'],
        coords: { x: 82, y: 78 }
      }
    ]
  },
  danger: {
    id: 'danger',
    locationName: 'Kota Bharu, Pasir Mas',
    locationArea: 'Kelantan River Basin',
    riskLevel: 'danger',
    headlineEn: 'Immediate Evacuation Directive',
    headlineBm: 'Arahan Pemindahan Segera',
    directiveEn: 'Critical river overflow. Evacuate immediately to designated relief center.',
    directiveBm: 'Limpahan sungai tahap bahaya. Pindah segera ke pusat pemindahan ditetapkan.',
    hazardSummaryEn: 'Sungai Kelantan surpassed danger mark (10.8m). Low-lying residential areas inundated up to 1.5m.',
    hazardSummaryBm: 'Sungai Kelantan melepasi paras bahaya (10.8m). Kawasan perumahan rendah dinaiki air sehingga 1.5m.',
    primaryActionEn: 'Evacuate to Nearest Safe Haven',
    primaryActionBm: 'Pindah ke Pusat Pemindahan Segera',
    primaryActionSubtitleEn: 'SMK Sultan Ibrahim (600m away • 8 min walk)',
    primaryActionSubtitleBm: 'SMK Sultan Ibrahim (600m • 8 min berjalan)',
    nearestShelterId: 'shelter-kelantan-1',
    lat: 6.0416,
    lon: 102.1429,
    hazards: [
      {
        id: 'h-kb-1',
        title: 'Deep Flood Inundation (1.4m)',
        titleBm: 'Banjir Paras Dalam (1.4m)',
        type: 'flood',
        severity: 'danger',
        waterDepthMeters: 1.4,
        affectedRoads: ['Jalan Pasir Mas - Salor', 'Laluan Kampung Sireh'],
        descriptionEn: 'Dangerous strong currents. Inaccessible to all vehicles. Rescue boats deployed.',
        descriptionBm: 'Arus deras berbahaya. Tidak boleh dilalui sebarang kenderaan. Bot penyelamat beroperasi.',
        coords: { x: 48, y: 50, radius: 26 }
      }
    ],
    shelters: [
      {
        id: 'shelter-kelantan-1',
        name: 'SMK Sultan Ibrahim 1 (High Ground)',
        nameBm: 'SMK Sultan Ibrahim 1 (Kawasan Tinggi)',
        area: 'Pasir Mas, Kelantan',
        distanceKm: 0.6,
        walkMinutes: 8,
        driveMinutes: 3,
        status: 'open',
        capacityCurrent: 310,
        capacityTotal: 650,
        address: 'Jalan Pasir Mas, 17000 Pasir Mas, Kelantan',
        phone: '+609-790 9244',
        amenities: ['food', 'water', 'medical', 'bedding', 'power'],
        coords: { x: 22, y: 35 }
      },
      {
        id: 'shelter-kelantan-2',
        name: 'Dewan Majlis Daerah Pasir Mas',
        nameBm: 'Dewan Majlis Daerah Pasir Mas',
        area: 'Bandar Baru Pasir Mas',
        distanceKm: 1.8,
        walkMinutes: 24,
        driveMinutes: 7,
        status: 'limited',
        capacityCurrent: 440,
        capacityTotal: 500,
        address: 'Bandar Baru, 17000 Pasir Mas',
        phone: '+609-790 9200',
        amenities: ['food', 'water', 'medical', 'bedding'],
        coords: { x: 80, y: 65 }
      }
    ]
  },
  safe: {
    id: 'safe',
    locationName: 'Bayan Lepas, Pulau Pinang',
    locationArea: 'Southwest District, Penang',
    riskLevel: 'safe',
    headlineEn: 'Area Currently Clear',
    headlineBm: 'Kawasan Anda Selamat',
    directiveEn: 'No active flood or severe storm alerts in your immediate radius.',
    directiveBm: 'Tiada amaran banjir atau ribut aktif di kawasan sekitar anda.',
    hazardSummaryEn: 'Normal drainage conditions. Light passing shower expected in late afternoon.',
    hazardSummaryBm: 'Keadaan saliran normal. Hujan renyai dijangka pada lewat petang.',
    primaryActionEn: 'Review Emergency Survival Kit',
    primaryActionBm: 'Semak Beg Kecemasan (Survival Kit)',
    primaryActionSubtitleEn: 'Ensure 72-hour family essentials are packed',
    primaryActionSubtitleBm: 'Pastikan keperluan asas 72 jam keluarga lengkap',
    nearestShelterId: 'shelter-penang-1',
    lat: 5.2948,
    lon: 100.2596,
    hazards: [],
    shelters: [
      {
        id: 'shelter-penang-1',
        name: 'Dewan Komuniti Bayan Baru',
        nameBm: 'Dewan Komuniti Bayan Baru',
        area: 'Bayan Baru, Penang',
        distanceKm: 1.2,
        walkMinutes: 15,
        driveMinutes: 4,
        status: 'open',
        capacityCurrent: 0,
        capacityTotal: 300,
        address: 'Lintang Mayang Pasir 2, 11950 Bayan Lepas',
        phone: '+604-644 1234',
        amenities: ['food', 'water', 'power'],
        coords: { x: 45, y: 45 }
      }
    ]
  }
};

export const EMERGENCY_CONTACTS = [
  {
    id: 'mers-999',
    titleEn: 'MERS 999 (National Emergency)',
    titleBm: 'MERS 999 (Talian Kecemasan Pusat)',
    number: '999',
    descriptionEn: 'Police, Ambulance & General Distress',
    descriptionBm: 'Polis, Ambulans & Bantuan Kecemasan Am',
    iconType: 'police' as const,
    isPrimary: true
  },
  {
    id: 'bomba',
    titleEn: 'Bomba & Penyelamat (Fire & Rescue)',
    titleBm: 'Bomba & Penyelamat Malaysia',
    number: '994',
    descriptionEn: 'Flood boat rescue, trapped victims, tree falls',
    descriptionBm: 'Penyelamatan bot banjir, mangsa terkandas, pokok tumbang',
    iconType: 'fire' as const,
    isPrimary: true
  },
  {
    id: 'apm',
    titleEn: 'APM (Angkatan Pertahanan Awam)',
    titleBm: 'APM Pertahanan Awam',
    number: '+603-8051 8888',
    descriptionEn: 'Civil Defence & community evacuation assistance',
    descriptionBm: 'Bantuan pemindahan & operasi sokongan komuniti',
    iconType: 'civil' as const
  },
  {
    id: 'jkm',
    titleEn: 'Bilik Gerakan Bencana JKM (Welfare)',
    titleBm: 'Bilik Gerakan Bencana JKM',
    number: '+603-8323 1396',
    descriptionEn: 'Food rations, relief center registration, special needs',
    descriptionBm: 'Bantuan makanan, pendaftaran pusat pemindahan, OKU',
    iconType: 'welfare' as const
  },
  {
    id: 'bsmm',
    titleEn: 'Bulan Sabit Merah (Red Crescent)',
    titleBm: 'Bulan Sabit Merah Malaysia',
    number: '+603-2143 8122',
    descriptionEn: 'Emergency first-aid and medical supplies triage',
    descriptionBm: 'Pertolongan cemas & bantuan bekalan perubatan',
    iconType: 'crescent' as const
  }
];

export const OFFLINE_CHECKLIST_ITEMS = [
  {
    id: 'docs',
    titleEn: 'Important Documents in Sealed Plastic Bag',
    titleBm: 'Dokumen Penting dalam Plastik Kedap Udara',
    subtitleEn: 'IC (MyKad), passports, birth certificates, land deeds, insurance papers',
    subtitleBm: 'Kad Pengenalan (MyKad), pasport, surat beranak, geran, polisi insurans'
  },
  {
    id: 'water_food',
    titleEn: 'Clean Water & Non-Perishable Food (3 Days)',
    titleBm: 'Air Bersih & Makanan Tahan Lama (3 Hari)',
    subtitleEn: 'At least 3 liters of water per person, energy bars, canned food with pull-tabs',
    subtitleBm: 'Sekurang-kurangnya 3 liter air setiap orang, biskut tenaga, makanan tin'
  },
  {
    id: 'meds',
    titleEn: 'Essential Medications & First-Aid Kit',
    titleBm: 'Ubat-Ubatan Khas & Kit Pertolongan Cemas',
    subtitleEn: 'Chronic illness prescriptions (hypertension, asthma, insulin), antiseptic, plasters',
    subtitleBm: 'Ubat penyakit kronik (tekanan darah, asma, insulin), cecair antiseptik, plaster'
  },
  {
    id: 'power',
    titleEn: 'Charged Powerbank & Charging Cables',
    titleBm: 'Powerbank Penuh & Kabel Pengecas',
    subtitleEn: 'Keep phone in battery-saver mode. Turn off non-essential apps',
    subtitleBm: 'Kekalkan telefon dalam mod jimat bateri. Matikan aplikasi tidak perlu'
  },
  {
    id: 'light_whistle',
    titleEn: 'Waterproof Flashlight & Emergency Whistle',
    titleBm: 'Lampu Picit Kalis Air & Wisel Kecemasan',
    subtitleEn: 'A whistle is heard 3x farther than human voice if trapped by rising water',
    subtitleBm: 'Wisel kedengaran 3x lebih jauh berbanding suara jika terperangkap'
  },
  {
    id: 'cash',
    titleEn: 'Cash in Small Denominations (RM5, RM10, RM20)',
    titleBm: 'Wang Tunai Not Kecil (RM5, RM10, RM20)',
    subtitleEn: 'ATMs and card terminals may lose power and cellular network connection',
    subtitleBm: 'Mesin ATM dan terminal kad mungkin terputus bekalan elektrik & rangkaian'
  },
  {
    id: 'clothes',
    titleEn: 'One Dry Change of Clothes & Sturdy Shoes',
    titleBm: 'Satu Salinan Pakaian Kering & Kasut Bertutup',
    subtitleEn: 'Avoid walking barefoot or in flip-flops through submerged debris and sharp items',
    subtitleBm: 'Elakkan berkaki ayam atau berselipar di dalam air bagi mengelak kecederaan'
  }
];
