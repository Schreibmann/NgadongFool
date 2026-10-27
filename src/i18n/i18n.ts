import i18n from "i18n-js";
import ru from "./ru.json";

i18n.fallbacks = true;
i18n.translations = { ru };
i18n.locale = "ru";

type DefaultLocale = typeof ru;

type RecursiveKeyOfHandleValue<
  TValue,
  Text extends string,
> = TValue extends readonly unknown[]
  ? Text
  : TValue extends object
    ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
    : Text;

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `['${TKey}']` | `.${TKey}`
  >;
}[keyof TObj & (string | number)];

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `${TKey}`
  >;
}[keyof TObj & (string | number)];

export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;
