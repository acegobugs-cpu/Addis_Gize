import { Locale } from "./locale";

export interface Translation {
  locale: Locale;
  name: string;
  slug: string;
}

// 3. Define the Cat interface using a mapped type (Partial)
export type Cat = {
  id: string;
} & Partial<Record<Locale, Translation>>;

export interface CategoryLocale {
  id: string;
  locale: Locale
  name: string;
  slug: string;
  catID?: string;
}
