import { ChiSimBillingDateParser } from './parsers/chi_sim.js';
import { ChiTraBillingDateParser } from './parsers/chi_tra.js';
import { DeuBillingDateParser } from './parsers/deu.js';
import { EngBillingDateParser } from './parsers/eng.js';
import { FilBillingDateParser } from './parsers/fil.js';
import { IndBillingDateParser } from './parsers/ind.js';
import { JpnBillingDateParser } from './parsers/jpn.js';
import { KorBillingDateParser } from './parsers/kor.js';
import { MsaBillingDateParser } from './parsers/msa.js';
import { ThaBillingDateParser } from './parsers/tha.js';
import { VieBillingDateParser } from './parsers/vie.js';
import { OCRTypes } from './types.js';

export namespace OCRConstants {
  export const supportedLanguages = [
    { name: 'English', code: 'eng' },
    { name: 'Chinese - Traditional', code: 'chi_tra' },
    { name: 'Chinese - Simplified', code: 'chi_sim' },
    { name: 'German', code: 'deu' },
    { name: 'Filipino', code: 'fil' },
    { name: 'Indonesian', code: 'ind' },
    { name: 'Japanese', code: 'jpn' },
    { name: 'Korean', code: 'kor' },
    { name: 'Malay', code: 'msa' },
    { name: 'Thai', code: 'tha' },
    { name: 'Vietnamese', code: 'vie' },
  ] as const;

  export type TSupportedLangCode = (typeof supportedLanguages)[number]['code'];

  export const billingDateParsers: OCRTypes.BillingDateParser[] = [
    new EngBillingDateParser('eng'),
    new ChiTraBillingDateParser('chi_tra'),
    new ChiSimBillingDateParser('chi_sim'),
    new DeuBillingDateParser('deu'),
    new FilBillingDateParser('fil'),
    new IndBillingDateParser('ind'),
    new JpnBillingDateParser('jpn'),
    new KorBillingDateParser('kor'),
    new MsaBillingDateParser('msa'),
    new ThaBillingDateParser('tha'),
    new VieBillingDateParser('vie'),
  ];
}
