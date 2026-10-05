import { useMemo, useState } from 'react';
import { LanguageContext } from './language-context';

const dictionary = {
  en: {
    overview: 'Overview', liveMap: 'Live map', report: 'Report', shelters: 'Shelters', commandCenter: 'Command center', signIn: 'Sign in', signOut: 'Sign out',
    live: 'SYSTEM LIVE', heroKicker: 'Unified emergency response', heroLine1: 'When every', heroLine2: 'second', heroLine3: 'matters.', heroDescription: 'One coordinated network for faster alerts, safer communities, and relief that reaches people when it matters most.',
    emergencySOS: 'Emergency SOS', reportIncident: 'Report incident', openMap: 'Open live map', latestIncidents: 'Latest incident reports', safetyAssistant: 'Safety assistant'
  },
  hi: {
    overview: 'अवलोकन', liveMap: 'लाइव मानचित्र', report: 'रिपोर्ट', shelters: 'आश्रय', commandCenter: 'नियंत्रण केंद्र', signIn: 'साइन इन', signOut: 'साइन आउट',
    live: 'सिस्टम लाइव', heroKicker: 'एकीकृत आपातकालीन प्रतिक्रिया', heroLine1: 'जब हर', heroLine2: 'सेकंड', heroLine3: 'महत्वपूर्ण हो।', heroDescription: 'तेज़ अलर्ट, सुरक्षित समुदाय और ज़रूरत के समय सहायता पहुँचाने वाला एक समन्वित नेटवर्क।',
    emergencySOS: 'आपातकालीन SOS', reportIncident: 'घटना रिपोर्ट करें', openMap: 'लाइव मानचित्र खोलें', latestIncidents: 'नवीनतम घटना रिपोर्ट', safetyAssistant: 'सुरक्षा सहायक'
  }
};
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') === 'hi' ? 'hi' : 'en');
  const toggleLanguage = () => setLanguage((current) => {
    const next = current === 'en' ? 'hi' : 'en';
    localStorage.setItem('language', next);
    return next;
  });
  const value = useMemo(() => ({ language, toggleLanguage, t: (key) => dictionary[language][key] || key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
