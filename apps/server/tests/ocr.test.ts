import { beforeAll, describe, expect, it } from '@jest/globals';

import {
  OCRService,
  type RecognizedDate,
  supportedOCRLanguages,
} from '../src/services/ocr/index.js';

let ocrService: OCRService;

const TIMEOUT = 30 * 1000;

beforeAll(() => {
  ocrService = new OCRService();
});

const testMap: Record<
  (typeof supportedOCRLanguages)[number]['code'],
  { url: string; date: RecognizedDate }
> = {
  eng: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/eng_240703.png',
    date: { month: 7, day: 6 },
  },
  chi_sim: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/chi_sim_240703.png',
    date: { month: 7, day: 6 },
  },
  chi_tra: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/chi_tra_240703.png',
    date: { month: 7, day: 6 },
  },
  deu: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/deu_240703.png',
    date: { month: 7, day: 6 },
  },
  fil: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/fil_240703.png',
    date: { month: 7, day: 6 },
  },
  ind: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/ind_240703.png',
    date: { month: 7, day: 6 },
  },
  jpn: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/jpn_240703.png',
    date: { month: 7, day: 6 },
  },
  kor: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/kor_240703.png',
    date: { month: 7, day: 6 },
  },
  msa: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/msa_240703.png',
    date: { month: 7, day: 6 },
  },
  tha: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/tha_240703.png',
    date: { month: 7, day: 6 },
  },
  vie: {
    url: 'https://divine-bridge-cdn.jerrycool123.com/vie_240703.png',
    date: { month: 7, day: 6 },
  },
};

describe('Test Membership screenshot OCR with different languages', () => {
  it(
    'eng (English)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.eng.url, 'eng');
      expect(result).toStrictEqual({ success: true, date: testMap.eng.date });
    },
    TIMEOUT,
  );

  it(
    'chi_sim (Chinese Simplified)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.chi_sim.url, 'chi_sim');
      expect(result).toStrictEqual({ success: true, date: testMap.chi_sim.date });
    },
    TIMEOUT,
  );

  it(
    'chi_tra (Chinese Traditional)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.chi_tra.url, 'chi_tra');
      expect(result).toStrictEqual({ success: true, date: testMap.chi_tra.date });
    },
    TIMEOUT,
  );

  it(
    'deu (German)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.deu.url, 'deu');
      expect(result).toStrictEqual({ success: true, date: testMap.deu.date });
    },
    TIMEOUT,
  );

  it(
    'fil (Filipino)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.fil.url, 'fil');
      expect(result).toStrictEqual({ success: true, date: testMap.fil.date });
    },
    TIMEOUT,
  );

  it(
    'ind (Indonesian)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.ind.url, 'ind');
      expect(result).toStrictEqual({ success: true, date: testMap.ind.date });
    },
    TIMEOUT,
  );

  it(
    'jpn (Japanese)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.jpn.url, 'jpn');
      expect(result).toStrictEqual({ success: true, date: testMap.jpn.date });
    },
    TIMEOUT,
  );

  it(
    'kor (Korean)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.kor.url, 'kor');
      expect(result).toStrictEqual({ success: true, date: testMap.kor.date });
    },
    TIMEOUT,
  );

  it(
    'msa (Malay)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.msa.url, 'msa');
      expect(result).toStrictEqual({ success: true, date: testMap.msa.date });
    },
    TIMEOUT,
  );

  it(
    'tha (Thai)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.tha.url, 'tha');
      expect(result).toStrictEqual({ success: true, date: testMap.tha.date });
    },
    TIMEOUT,
  );

  it(
    'vie (Vietnamese)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap.vie.url, 'vie');
      expect(result).toStrictEqual({ success: true, date: testMap.vie.date });
    },
    TIMEOUT,
  );
});
