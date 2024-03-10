export type WithI18nParams<T = unknown> = T & {
  params: {
    lng?: string | string[];
  };
};
