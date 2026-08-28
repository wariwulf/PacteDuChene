import {
  EconomyTransaction,
  EconomyTransactionDocument,
} from "./economy-transaction.model";

export class EconomyTransactionRepository {
  async create(
    data: Partial<EconomyTransactionDocument>
  ): Promise<EconomyTransactionDocument> {
    return EconomyTransaction.create(data);
  }

  async findDailyReward(
    userId: string,
    sourceId: string,
    currencyId: string
  ): Promise<EconomyTransactionDocument | null> {
    return EconomyTransaction.findOne({
      userId,
      type: "daily_reward",
      source: "discord",
      sourceId,
      currencyId,
    });
  }

  async findBySourceId(
    sourceId: string
  ): Promise<EconomyTransactionDocument | null> {
    return EconomyTransaction.findOne({ sourceId });
  }

  async deleteById(id: string): Promise<void> {
    await EconomyTransaction.deleteOne({ _id: id });
  }

  async findByUserId(
    userId: string,
    limit = 50
  ): Promise<EconomyTransactionDocument[]> {
    return EconomyTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const economyTransactionRepository =
  new EconomyTransactionRepository();
