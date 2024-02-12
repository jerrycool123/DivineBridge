import { OCRTypes } from '../types.js';

export class MsaBillingDateParser implements OCRTypes.BillingDateParser {
  constructor(public readonly language: 'msa') {}
  parse(lines: string[]): OCRTypes.RecognizedDate {
    const regex =
      /Tarikhpengebilanseterusnya:(\d{1,2})(Jan|Feb|Mac|Apr|Mei|Jun|Jul|Ogos|Sep|Okt|Nov|Dis)(\d{4})/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match !== null) {
        const abbreviatedMonth = match[2];
        const monthMap: Record<string, number> = {
          Jan: 1,
          Feb: 2,
          Mac: 3,
          Apr: 4,
          Mei: 5,
          Jun: 6,
          Jul: 7,
          Ogos: 8,
          Sep: 9,
          Okt: 10,
          Nov: 11,
          Dis: 12,
        };
        const month = monthMap[abbreviatedMonth];
        const [day, , year] = match.slice(1, 4).map((s) => parseInt(s, 10));
        return { year, month, day };
      }
    }
    return OCRTypes.BillingDateParser.emptyDate;
  }
}
