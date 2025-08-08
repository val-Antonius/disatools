export interface ReportData {
  _id: string;
  name: string;
  description: string;
  // Add other properties from your Report model here
  [key: string]: any; // Allows for other properties not explicitly defined
}
