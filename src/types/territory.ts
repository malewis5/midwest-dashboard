export interface TerritoryBoundary {
  territory_name: string;
  points: Array<{
    lat: number;
    lng: number;
  }>;
}