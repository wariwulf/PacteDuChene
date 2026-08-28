import { Request, Response } from "express";
import { HealthService } from "./health.service";

const healthService = new HealthService();

export class HealthController {
  getHealth(_req: Request, res: Response) {
    const result = healthService.getHealth();

    res.json(result);
  }
}