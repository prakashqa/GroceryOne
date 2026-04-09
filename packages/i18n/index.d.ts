interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export declare const en: Record<string, Record<string, string | Record<string, string>>>;
export declare const te: Record<string, Record<string, string | Record<string, string>>>;
export declare const AVAILABLE_LANGUAGES: LanguageOption[];
