export type Language = 'en' | 'bn' | 'hi';

export interface Translations {
  tagline: string;
  nearbyVenues: string;
  searchPlaceholder: string;
  crowdConditions: string;
  safeRoutes: string;
  safetyAlerts: string;
  reportIssue: string;
  emergencyInfo: string;
  liveMap: string;
  entryGates: string;
  exitGates: string;
  emergencyExits: string;
  calculateRoute: string;
  selectStart: string;
  selectDestination: string;
  accessibleOnly: string;
  findSafeRoute: string;
  noRouteMessage: string;
  riskLow: string;
  riskMod: string;
  riskHigh: string;
  riskCrit: string;
  riskUnk: string;
  demoDataBadge: string;
  offlineNotice: string;
  offlineTitle: string;
  policeContact: string;
  medicalContact: string;
  fireSafety: string;
  confidence: string;
  lastUpdated: string;
  personsPerSqM: string;
  inflow: string;
  outflow: string;
  capacity: string;
  officialAnnouncement: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    tagline: 'Detect the danger. Guide the crowd. Protect lives.',
    nearbyVenues: 'Nearby Places & Active Events',
    searchPlaceholder: 'Search venues, stations, pandals, gates...',
    crowdConditions: 'Crowd Status',
    safeRoutes: 'Verified Safe Route',
    safetyAlerts: 'Safety Alerts',
    reportIssue: 'Report Safety Hazard',
    emergencyInfo: 'Emergency Protocol',
    liveMap: 'Interactive Venue Map',
    entryGates: 'Entry Gates',
    exitGates: 'Exit Gates',
    emergencyExits: 'Emergency Exits',
    calculateRoute: 'Plan Smart Evacuation / Ingress',
    selectStart: 'Select Starting Gate / Point',
    selectDestination: 'Select Destination Gate / Station',
    accessibleOnly: 'Wheelchair / Step-Free Accessible Route',
    findSafeRoute: 'Calculate Verified Safe Route',
    noRouteMessage: 'Live route guidance is unavailable. Follow official announcements and instructions from authorised venue staff.',
    riskLow: 'NORMAL FLOW',
    riskMod: 'MODERATE CROWD',
    riskHigh: 'HIGH DENSITY WARNING',
    riskCrit: 'CRITICAL CONGESTION',
    riskUnk: 'DATA UNAVAILABLE',
    demoDataBadge: 'DEMO DATA — NOT LIVE REAL-WORLD MONITORING',
    offlineNotice: 'Offline Mode: Displaying verified emergency venue guidelines and offline exit maps.',
    offlineTitle: 'Offline Emergency Safety Directive',
    policeContact: 'Police Assistance Booth',
    medicalContact: 'Emergency Medical Service',
    fireSafety: 'Fire & Rescue Marshal',
    confidence: 'Sensor Confidence',
    lastUpdated: 'Last Updated',
    personsPerSqM: 'persons/m²',
    inflow: 'Inflow',
    outflow: 'Outflow',
    capacity: 'Safe Capacity',
    officialAnnouncement: 'Authorized Announcements',
  },
  bn: {
    tagline: 'বিপদ চিহ্নিত করুন। ভিড় নিয়ন্ত্রণ করুন। জীবন রক্ষা করুন।',
    nearbyVenues: 'কাছের স্থান ও চলমান অনুষ্ঠান',
    searchPlaceholder: 'প্যান্ডেল, স্টেশন, গেট খুঁজুন...',
    crowdConditions: 'ভিড়ের পরিস্থিতি',
    safeRoutes: 'যাচাইকৃত নিরাপদ পথ',
    safetyAlerts: 'জরুরি নিরাপত্তা সতর্কতা',
    reportIssue: 'বিপদ বা বাধার তথ্য দিন',
    emergencyInfo: 'জরুরি নির্দেশিকা',
    liveMap: 'লাইভ ভেন্যু ম্যাপ',
    entryGates: 'প্রবেশদ্বার সমূহ',
    exitGates: 'প্রস্থানদ্বার সমূহ',
    emergencyExits: 'জরুরি নির্গমন পথ',
    calculateRoute: 'নিরাপদ চলাচলের পথ খুঁজুন',
    selectStart: 'শুরুর প্রবেশদ্বার বা স্থান নির্বাচন করুন',
    selectDestination: 'গন্তব্য গেট বা কেন্দ্র নির্বাচন করুন',
    accessibleOnly: 'হুইলচেয়ার ও সিঁড়িমুক্ত পথ',
    findSafeRoute: 'নিরাপদ পথ গণনা করুন',
    noRouteMessage: 'লাইভ দিকনির্দেশ সাময়িকভাবে অনুপলব্ধ। মাঠের পুলিশ ও নিরাপত্তা কর্মীদের নির্দেশ মেনে চলুন।',
    riskLow: 'স্বাভাবিক চলাচল',
    riskMod: 'মাঝারি ভিড়',
    riskHigh: 'অতিরিক্ত ভিড়ের সতর্কতা',
    riskCrit: 'বিপজ্জনক ভিড় - জরুরি ব্যবস্থা',
    riskUnk: 'তথ্য অনুপলব্ধ',
    demoDataBadge: 'ডেমো ডেটা — লাইভ নজরদারি নয়',
    offlineNotice: 'অফলাইন মোড: ক্যাশ করা জরুরি নিরাপত্তা নির্দেশাবলী প্রদর্শিত হচ্ছে।',
    offlineTitle: 'অফলাইন জরুরি নিরাপত্তা নির্দেশাবলী',
    policeContact: 'পুলিশ সহায়তা বুথ',
    medicalContact: 'জরুরি চিকিৎসা কেন্দ্র',
    fireSafety: 'দমকল ও উদ্ধারকারী দল',
    confidence: 'সেন্সর নির্ভরযোগ্যতা',
    lastUpdated: 'সর্বশেষ আপডেট',
    personsPerSqM: 'জন/বর্গমিটার',
    inflow: 'প্রবেশ গতি',
    outflow: 'বাহির গতি',
    capacity: 'নিরাপদ ধারণক্ষমতা',
    officialAnnouncement: 'প্রশাসনিক ঘোষণা',
  },
  hi: {
    tagline: 'खतरे को पहचानें। भीड़ को दिशा दें। जीवन बचाएं।',
    nearbyVenues: 'आसपास के स्थल एवं सक्रिय कार्यक्रम',
    searchPlaceholder: 'स्थान, स्टेशन, पंडाल या गेट खोजें...',
    crowdConditions: 'भीड़ की स्थिति',
    safeRoutes: 'सत्यापित सुरक्षित मार्ग',
    safetyAlerts: 'सुरक्षा अलर्ट',
    reportIssue: 'समस्या या भीड़ की सूचना दें',
    emergencyInfo: 'आपातकालीन निर्देश',
    liveMap: 'सक्रिय स्थल मानचित्र',
    entryGates: 'प्रवेश द्वार',
    exitGates: 'निकास द्वार',
    emergencyExits: 'आपातकालीन निकास',
    calculateRoute: 'सुरक्षित निकास या प्रवेश मार्ग देखें',
    selectStart: 'प्रारंभिक बिंदु या गेट चुनें',
    selectDestination: 'गंतव्य गेट चुनें',
    accessibleOnly: 'व्हीलचेयर सुगम्य मार्ग',
    findSafeRoute: 'सुरक्षित मार्ग खोजें',
    noRouteMessage: 'मार्गदर्शन वर्तमान में अनुपलब्ध है। कृपया सुरक्षा कर्मियों के निर्देशों का पालन करें।',
    riskLow: 'सामान्य प्रवाह',
    riskMod: 'मध्यम भीड़',
    riskHigh: 'उच्च भीड़ चेतावनी',
    riskCrit: 'अत्यधिक गंभीर भीड़',
    riskUnk: 'डेटा उपलब्ध नहीं',
    demoDataBadge: 'डेमो डेटा — लाइव वास्तविक निगरानी नहीं',
    offlineNotice: 'ऑफ़लाइन मोड: सत्यापित आपातकालीन निर्देश दिखाए जा रहे हैं।',
    offlineTitle: 'ऑफ़लाइन आपातकालीन सुरक्षा निर्देश',
    policeContact: 'पुलिस सहायता केंद्र',
    medicalContact: 'आपातकालीन चिकित्सा सहायता',
    fireSafety: 'अग्निशमन एवं राहत दल',
    confidence: 'सटीकता',
    lastUpdated: 'अंतिम अपडेट',
    personsPerSqM: 'व्यक्ति/वर्ग मी.',
    inflow: 'आगमन दर',
    outflow: 'निकास दर',
    capacity: 'सुरक्षित क्षमता',
    officialAnnouncement: 'अधिकृत घोषणाएं',
  },
};
