export type WithI18nParams<P = Record<string, never>, T = unknown> = T & {
  params: Promise<
    P & {
      lng?: string | string[];
    }
  >;
};
