export interface ReportData {
  _id: string;
  name: string;
  description: string;
  // Add other properties from your Report model here
  [key: string]: string | number | boolean | Date | null | undefined | unknown; // Allow JsonValue and other complex types
}
