import { apiFetch } from "@/lib/api/client";

export interface EconomyTransaction {
  _id: string;
  userId: string;
  currencyId: string;
  amount: number;
  type: string;
  source?: string;
  sourceId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface EconomyHistoryResponse {
  success: boolean;
  data: EconomyTransaction[];
  message?: string;
}

export async function getEconomyHistory(
  userId: string
): Promise<EconomyTransaction[]> {
  const response = await apiFetch<EconomyHistoryResponse>(
    `/economy/${userId}/history`
  );

  return response.data;
}