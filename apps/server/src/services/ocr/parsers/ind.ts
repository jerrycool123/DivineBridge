import { OCRTypes } from '../types.js';

export class IndBillingDateParser implements OCRTypes.BillingDateParser {
  constructor(public readonly language: 'ind') {}
  parse(lines: string[]): OCRTypes.RecognizedDate {
    const regex =
      /Tanggalpenagihanberikutnya:(\d{1,2})(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)(\d{4})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const abbreviatedMonth = match[2];
        const monthMap: Record<string, number> = {
          Jan: 1,
          Feb: 2,
          Mar: 3,
          Apr: 4,
          Mei: 5,
          Jun: 6,
          Jul: 7,
          Agu: 8,
          Sep: 9,
          Okt: 10,
          Nov: 11,
          Des: 12,
        };
        const month = monthMap[abbreviatedMonth];
        const [day, , year] = match.slice(1, 4).map((s) => parseInt(s, 10));
        return { year, month, day };
      }
    }
    return OCRTypes.BillingDateParser.emptyDate;
  }
}
