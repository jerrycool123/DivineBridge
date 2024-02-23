export interface RecognizedDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export abstract class BillingDateParser {
  public static readonly emptyDate: RecognizedDate = { year: null, month: null, day: null };

  constructor(public readonly code: string) {}

  public abstract parse(lines: string[]): RecognizedDate;
}
