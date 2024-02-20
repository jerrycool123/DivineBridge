export interface UserPayload {
  id: string;
  name: string;
  image: string;
}

export interface RecognizedDate {
  year: number | null;
  month: number | null;
  day: number | null;
}
