import { useLanguageStore } from '../store/LanguageStore';
import { translations } from './translations';

export function useT() {
  const { locale } = useLanguageStore();
  return translations[locale];
}
