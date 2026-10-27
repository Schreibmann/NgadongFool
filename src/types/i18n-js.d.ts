declare module "i18n-js" {
  export type TranslateOptions = Record<string, string | number | undefined>;

  interface I18n {
    locale: string;
    fallbacks: boolean;
    translations: Record<string, object>;
    t(key: string, options?: TranslateOptions): string;
  }

  const i18n: I18n;
  export default i18n;
}
