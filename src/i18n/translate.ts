import i18n, { type TranslateOptions } from "i18n-js";
import type { TxKeyPath } from "./i18n";

export function translate(key: TxKeyPath, options?: TranslateOptions) {
  return key ? i18n.t(key, options) : null;
}
