export type IApiCallLogEntry = {
  id?: number;
  method: string;
  endpoint: string;
  success: boolean;
  timestamp: string;
  errorMessage?: string;
  responseData?: any;
};
