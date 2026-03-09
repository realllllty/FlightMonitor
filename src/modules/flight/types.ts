export type TripType = 'oneway' | 'roundtrip';

export interface SearchTime {
  type: TripType;
  departDate: string;
  returnDate?: string;
}

export interface FlightSearchProject {
  id: string;
  enabled: boolean;
  from: string;
  to: string;
  thresholdPrice: number;
  currency: string;
  times: SearchTime[];
}

export interface FlightQuote {
  projectId: string;
  from: string;
  to: string;
  type: TripType;
  departDate: string;
  returnDate?: string;
  price: number;
  currency: string;
  provider: string;
  searchedAt: string;
}

export interface HistoryStore {
  records: FlightQuote[];
}
