/* eslint-disable turbo/no-undeclared-env-vars */
import { beforeAll } from '@jest/globals';
import { describe, expect, it } from '@jest/globals';
import { config } from 'dotenv';

import { OCRService, type RecognizedDate, supportedOCRLanguages } from '../src/index.js';

config({ path: '.env.test.local' });

let ocrService: OCRService;

const TIMEOUT = 30 * 1000;

export interface A {}

beforeAll(() => {
  if (process.env.OCR_API_ENDPOINT === undefined || process.env.OCR_API_KEY === undefined) {
    throw new Error('Please provide OCR_API_ENDPOINT and OCR_API_KEY in .env.test');
  }
  ocrService = new OCRService(process.env.OCR_API_ENDPOINT, process.env.OCR_API_KEY);
});

const testMap: Record<
  (typeof supportedOCRLanguages)[number]['code'],
  { url: string; date: RecognizedDate }
> = {
  eng: {
    url: 'https://i.imgur.com/YXgHJGm.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  chi_sim: {
    url: 'https://i.imgur.com/DTBquNF.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  chi_tra: {
    url: 'https://i.imgur.com/p3wiZD3.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  deu: {
    url: 'https://i.imgur.com/eYzCnni.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  fil: {
    url: 'https://i.imgur.com/yqMDdJS.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  ind: {
    url: 'https://i.imgur.com/erKLG7p.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  jpn: {
    url: 'https://i.imgur.com/MUdFtam.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  kor: {
    url: 'https://i.imgur.com/mnB29Fc.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  msa: {
    url: 'https://i.imgur.com/QgnZT86.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  tha: {
    url: 'https://i.imgur.com/yD87ey7.png',
    date: { year: 2024, month: 3, day: 6 },
  },
  vie: {
    url: 'https://i.imgur.com/DNwf1rY.png',
    date: { year: 2024, month: 3, day: 6 },
  },
};

describe('Test Membership screenshot OCR with different languages', () => {
  it(
    'eng (English)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['eng'].url, 'eng');
      expect(result).toStrictEqual({ success: true, date: testMap['eng'].date });
    },
    TIMEOUT,
  );

  it(
    'chi_sim (Chinese Simplified)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['chi_sim'].url, 'chi_sim');
      expect(result).toStrictEqual({ success: true, date: testMap['chi_sim'].date });
    },
    TIMEOUT,
  );

  it(
    'chi_tra (Chinese Traditional)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['chi_tra'].url, 'chi_tra');
      expect(result).toStrictEqual({ success: true, date: testMap['chi_tra'].date });
    },
    TIMEOUT,
  );

  it(
    'deu (German)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['deu'].url, 'deu');
      expect(result).toStrictEqual({ success: true, date: testMap['deu'].date });
    },
    TIMEOUT,
  );

  it(
    'fil (Filipino)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['fil'].url, 'fil');
      expect(result).toStrictEqual({ success: true, date: testMap['fil'].date });
    },
    TIMEOUT,
  );

  it(
    'ind (Indonesian)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['ind'].url, 'ind');
      expect(result).toStrictEqual({ success: true, date: testMap['ind'].date });
    },
    TIMEOUT,
  );

  it(
    'jpn (Japanese)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['jpn'].url, 'jpn');
      expect(result).toStrictEqual({ success: true, date: testMap['jpn'].date });
    },
    TIMEOUT,
  );

  it(
    'kor (Korean)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['kor'].url, 'kor');
      expect(result).toStrictEqual({ success: true, date: testMap['kor'].date });
    },
    TIMEOUT,
  );

  it(
    'msa (Malay)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['msa'].url, 'msa');
      expect(result).toStrictEqual({ success: true, date: testMap['msa'].date });
    },
    TIMEOUT,
  );

  it(
    'tha (Thai)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['tha'].url, 'tha');
      expect(result).toStrictEqual({ success: true, date: testMap['tha'].date });
    },
    TIMEOUT,
  );

  it(
    'vie (Vietnamese)',
    async () => {
      const result = await ocrService.recognizeBillingDate(testMap['vie'].url, 'vie');
      expect(result).toStrictEqual({ success: true, date: testMap['vie'].date });
    },
    TIMEOUT,
  );
});
