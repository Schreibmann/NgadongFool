import i18n, { TranslateOptions } from "i18n-js";
import { TxKeyPath } from "./i18n";

export function translate(key: TxKeyPath, options?: TranslateOptions) {
  return key ? i18n.t(key, options) : null;
}
