import { OCRConstants } from './constants.js';

export namespace OCRTypes {
  export interface RecognizedDate {
    year: number | null;
    month: number | null;
    day: number | null;
  }

  export abstract class BillingDateParser {
    constructor(public readonly language: OCRConstants.TSupportedLangCode) {}
    public static readonly emptyDate: RecognizedDate = { year: null, month: null, day: null };
    public abstract parse(lines: string[]): RecognizedDate;
  }
}
