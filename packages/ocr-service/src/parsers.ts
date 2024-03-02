import {
  ChiSimBillingDateParser,
  ChiTraBillingDateParser,
  DeuBillingDateParser,
  EngBillingDateParser,
  FilBillingDateParser,
  IndBillingDateParser,
  JpnBillingDateParser,
  KorBillingDateParser,
  MsaBillingDateParser,
  ThaBillingDateParser,
  VieBillingDateParser,
} from './parsers/index.js';

/* ======================================================================== */

/**
 * For developers: you can extend this to support more languages
 * */
export const billingDateParsers = {
  English: new EngBillingDateParser('eng'),
  简体中文: new ChiSimBillingDateParser('chi_sim'),
  繁體中文: new ChiTraBillingDateParser('chi_tra'),
  German: new DeuBillingDateParser('deu'),
  Filipino: new FilBillingDateParser('fil'),
  Indonesian: new IndBillingDateParser('ind'),
  Japanese: new JpnBillingDateParser('jpn'),
  Korean: new KorBillingDateParser('kor'),
  Malay: new MsaBillingDateParser('msa'),
  Thai: new ThaBillingDateParser('tha'),
  Vietnamese: new VieBillingDateParser('vie'),
};

/* ======================================================================== */

export const supportedOCRLanguages = Object.entries(billingDateParsers).map(
  ([language, parser]) => ({
    language: language as keyof typeof billingDateParsers,
    code: parser.code,
  }),
);

export type TSupportedLangCode = (typeof supportedOCRLanguages)[number]['code'];
