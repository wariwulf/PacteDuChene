import { ApiResponse } from "../../common/types/api-response";

export interface HealthData {
  status: string;
  application: string;
  version: string;
  timestamp: string;
}

export class HealthService {
  getHealth(): ApiResponse<HealthData> {
    return {
      success: true,
      data: {
        status: "ok",
        application: "Le Pacte du Chêne",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      },
    };
  }
}