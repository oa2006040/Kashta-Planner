import { createContext, useContext, useEffect, useState } from "react";
import { translations, getTranslation } from "@/lib/i18n";

type Language = "ar" | "en";

type LanguageProviderState = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (ar: string, en: string) => string;
  tr: (key: string) => string;
};

const initialState: LanguageProviderState = {
  language: "ar",
  setLanguage: () => null,
  t: (ar) => ar,
  tr: (key) => key,
};

const LanguageProviderContext = createContext<LanguageProviderState>(initialState);

function getStoredLanguage(storageKey: string, defaultLanguage: Language): Language {
  if (typeof window === "undefined") return defaultLanguage;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // localStorage not available
  }
  return defaultLanguage;
}

export function LanguageProvider({
  children,
  defaultLanguage = "ar",
  storageKey = "kashta-language",
}: {
  children: React.ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
}) {
  const [language, setLanguageState] = useState<Language>(() => 
    getStoredLanguage(storageKey, defaultLanguage)
  );

  // Persist default language on mount if not set (runs only once)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        localStorage.setItem(storageKey, defaultLanguage);
      }
    } catch {
      // localStorage not available
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    
    if (language === "ar") {
      root.setAttribute("dir", "rtl");
      root.setAttribute("lang", "ar");
    } else {
      root.setAttribute("dir", "ltr");
      root.setAttribute("lang", "en");
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem(storageKey, lang);
    } catch {
      // localStorage not available
    }
    setLanguageState(lang);
  };

  const value = {
    language,
    setLanguage,
    t: (ar: string, en: string) => (language === "ar" ? ar : en),
    tr: (key: string) => getTranslation(translations, key, language),
  };

  return (
    <LanguageProviderContext.Provider value={value}>
      {children}
    </LanguageProviderContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext);

  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider");

  return context;
};
