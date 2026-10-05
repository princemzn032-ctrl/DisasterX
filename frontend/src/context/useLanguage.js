import { useContext } from 'react';
import { LanguageContext } from './language-context';

export const useLanguage = () => {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used within LanguageProvider');
  return value;
};
