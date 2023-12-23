type Value = number | boolean | string | null;
type Prefix = "n" | "b" | "s";

type StripPrefix<T extends string> = T extends `${Prefix}:${infer P}?`
  ? P
  : T extends `${Prefix}:${infer P}`
  ? P
  : T;

type StripSuffix<T extends string> = T extends `${infer P}?` ? P : T;
type OptionalKeys<T extends string> = T extends `${infer P}?` ? P : never;
type RequiredKeys<T extends string> = T extends `${infer _}?` ? never : T;

type Entry<T extends string> = {
  [K in RequiredKeys<T> as StripSuffix<
    StripPrefix<K>
  >]: K extends `${infer P}:${infer _}`
    ? P extends "n"
      ? number
      : P extends "b"
      ? boolean
      : P extends "s"
      ? string
      : Value
    : Value;
} & {
  [K in OptionalKeys<T> as StripSuffix<
    StripPrefix<K>
  >]?: K extends `${infer P}:${infer _}`
    ? P extends "n"
      ? number
      : P extends "b"
      ? boolean
      : P extends "s"
      ? string
      : Value
    : Value;
};

export { type Value, type Entry };
