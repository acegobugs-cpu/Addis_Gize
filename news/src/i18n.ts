import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const resources = {
  en: {
    translation: {
      tikvah_ethiopia: "TIKVAH ETHIOPIA",
      search_articles: "Search articles...",
      media: "media",
      no_media: "No media provided",
      breaking_news: "Breaking News",
      trending: "Trending",
      more: "More Stories",
      categories: "Categories",
      allRightsReserved: "All rights reserved",
      about: "About Us",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      
      // Footer Translations
      footer_description: "Delivering accurate, timely news and in-depth reporting from around the globe. Stay informed with our dedicated coverage across world affairs, tech, culture, and sports.",
      news_desk: "News Desk",
      politics: "Politics",
      business_markets: "Business & Markets",
      technology: "Technology",
      science_climate: "Science & Climate",
      arts_culture: "Arts & Culture",
      sports: "Sports",
      
      company: "Company",
      careers: "Careers",
      we_are_hiring: "We're hiring",
      press_room: "Press Room",
      editorial_standards: "Editorial Standards",
      
      stay_updated: "Stay Updated",
      newsletter_tagline: "Get top news alerts delivered to your inbox every morning.",
      enter_email: "Enter your email",
      subscribe_now: "Subscribe Now",
      
      cookie_policy: "Cookie Policy",
      sitemap: "Sitemap",
    },
  },
  om: {
    translation: {
      tikvah_ethiopia: "TIKVAH ETHIOPIA",
      search_articles: "Barruulee barbaadi",
      media: "miidyaa",
      no_media: "miidiyaan hin kennamne",
      breaking_news: "Oduu cimaa",
      trending: "Oduu Haaraa",
      more: "Seenaa dabalataa",
      categories: "Gosoota",
      allRightsReserved: "Mirgi Qopheessaa Seeraan Kan Eegame",
      about: "Waa'ee Keenya",
      contact: "Quunnamuu",
      privacy: "Imaammata Dhuunfummaa",
      terms: "Jechoota Fi Haala",
      
      // Footer Translations
      footer_description: "Oduu sirrii, yeroo isaanii eeggataniin fi gabaasa gad fageenyaa addunyaa dhiheessuu. Odeeffannoo addunyaa, teeknoolojii, aadaa fi ispoortii irratti odeeffannoo qabaadhaa.",
      news_desk: "Tajaajila Oduu",
      politics: "Sera-Aadaa / Politikaa",
      business_markets: "Dabbasaa & Gabaa",
      technology: "Teeknoolojii",
      science_climate: "Saayinsii & Qilleensa",
      arts_culture: "Aartii & Aadaa",
      sports: "Ispoortii",
      
      company: "Dhaabbata",
      careers: "Hojii",
      we_are_hiring: "Hojjettoota barbaadaa jirra",
      press_room: "Kuta Pressi",
      editorial_standards: "Ulaagaalee Gulaalaa",
      
      stay_updated: "Odeeffannoo Haaraa Argachuuf",
      newsletter_tagline: "Alertii oduu adda durummaa ganama ganama gara saanduqa keessaniitti argadhaa.",
      enter_email: "Imeelii keessan galchaa",
      subscribe_now: "Amma Galmeessaa",
      
      cookie_policy: "Imaammata Kuukii",
      sitemap: "Kaartaa Marsariitii",
    },
  },
  am: {
    translation: {
      tikvah_ethiopia: "ቲክቫ ኢትዮጵያ",
      search_articles: "ጽሑፎችን ይፈልጉ",
      media: "ሚዲያ",
      no_media: "ምንም ሚዲያ አልተሰጠም",
      breaking_news: "ሰበር ዜና",
      trending: "ወቅታዊ",
      more: "ተጨማሪ ዜና",
      categories: "ምድቦች",
      allRightsReserved: "ሁሉም መብቶች የተጠበቁ ናቸው",
      about: "ስለ እኛ",
      contact: "መገናኘት",
      privacy: "የግላዊነት ፖሊሲ",
      terms: "የአገልግሎት ውሎች",
      
      // Footer Translations
      footer_description: "ትክክለኛ፣ ወቅታዊ ዜናዎችን እና ጥልቅ ዘገባዎችን ከአለም ዙሪያ ያቀርባል። በአለም አቀፍ ጉዳዮች፣ ቴክኖሎጂ፣ ባህል እና ስፖርት ዙሪያ መረጃ ያግኙ።",
      news_desk: "የዜና ክፍል",
      politics: "ፖለቲካ",
      business_markets: "ንግድ እና ገበያ",
      technology: "ቴክኖሎጂ",
      science_climate: "ሳይንስ እና አየር ንብረት",
      arts_culture: "ኪነጥበብ እና ባህል",
      sports: "ስፖርት",
      
      company: "ኩባንያ",
      careers: "የሥራ እድሎች",
      we_are_hiring: "ሰራተኞችን እየቀጠርን ነው",
      press_room: "የፕሬስ ክፍል",
      editorial_standards: "የዝግጅት መመሪያዎች",
      
      stay_updated: "በየጊዜው መረጃ ያግኙ",
      newsletter_tagline: "በየጠዋቱ ዋና ዋና የዜና መረጃዎችን ወደ ኢሜይልዎ ያግኙ።",
      enter_email: "ኢሜይልዎን ያስገቡ",
      subscribe_now: "አሁኑኑ ይመዝገቡ",
      
      cookie_policy: "የኩኪ ፖሊሲ",
      sitemap: "የጣቢያ ካርታ",
    },
  },
  sw: {
    translation: {
      tikvah_ethiopia: "TIKVAH ETHIOPIA",
      search_articles: "Tafuta makala...",
      media: "Midia",
      no_media: "Hakuna midia iliyotolewa",
      breaking_news: "Habari Mpasuko",
      trending: "Zinazovuma",
      more: "Habari zaidi",
      categories: "Kategoria",
      allRightsReserved: "Haki zote zimehifadhiwa",
      about: "Kuhusu Sisi",
      contact: "Mawasiliano",
      privacy: "Sera ya Faragha",
      terms: "Vigezo na Masharti",
      
      // Footer Translations
      footer_description: "Kutoa habari sahihi, za wakati na ripoti za kina kutoka kote ulimwenguni. Pata taarifa za masuala ya dunia, teknolojia, utamaduni na michezo.",
      news_desk: "Dawati la Habari",
      politics: "Siasa",
      business_markets: "Biashara na Masoko",
      technology: "Teknolojia",
      science_climate: "Sayansi na Hali ya Hewa",
      arts_culture: "Sanaa na Utamaduni",
      sports: "Michezo",
      
      company: "Kampuni",
      careers: "Kazi",
      we_are_hiring: "Tunayeiri",
      press_room: "Chumba cha Habari",
      editorial_standards: "Viango vya Uhariri",
      
      stay_updated: "Pata Taarifa",
      newsletter_tagline: "Pata taarifa za habari kuu kwenye barua pepe yako kila asubuhi.",
      enter_email: "Weka barua pepe yako",
      subscribe_now: "Jiandikishe Sasa",
      
      cookie_policy: "Sera ya Vidakuzi",
      sitemap: "Ramani ya Tovuti",
    },
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'om',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    resources,
  });

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources['en'];
  }
}

export default i18n;