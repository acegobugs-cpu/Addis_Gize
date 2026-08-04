import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 1. Define resources object with explicit typing
export const resources = {
  en: {
    translation: {
      search_articles: "Search articles...",
      media: "media",
      no_media: "No media provided",
      breaking_news: "Breaking News",
      trending: "trending",
      more: "moreStories",
      categories: "categories",
      allRightsReserved: "ALL rights reserved",
      about: "About",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
    },
  },
  om: {
    translation: {
      search_articles: "Barruulee barbaadi",
      media: "miidyaa",
      no_media: "miidiyaan hin kennamne",
      breaking_news: "oduu cimaa",
      trending: "trending in afan oromo",
      more: "seenaa dabalataa",
      categories: "gosoota",
      allRightsReserved: "Mirgi Qopheessaa Seeraan Kan Eegame",
      about: "waa'ee",
      contact: "quunnamuu",
      privacy: "dhuunfummaa",
      terms: "jechoota",
    },
  },
  am: {
    translation: {
      search_articles: "ጽሑፎችን ይፈልጉ",
      media: "ሚዲያ",
      no_media: "ምንም ሚዲያ አልተሰጠም",
      breaking_news: "ሰበር ዜና",
      trending: "wektawi",
      more: "ተጨማሪ ዜና",
      categories: "ምድቦች",
      allRightsReserved: "ሁሉም መብቶች የተጠበቁ ናቸው",
      about: "ስለ",
      contact: "መገናኘት",
      privacy: "ግላዊነት",
      terms: "ውሎች",
    },
  },
} as const; // 'as const' ensures string literals stay strongly typed

// 2. Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'om',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React handles escaping automatically
    },
    resources,
  });

// 3. Type Augmentation: Enables auto-complete for t('key') across your app
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources['en'];
  }
}

export default i18n;