import {
  User,
  UserModelDocument,
} from "../users/user.model";

import {
  EconomyTransaction,
  EconomyTransactionDocument,
} from "./economy-transaction.model";
import { CURRENCY_IDS, type CurrencyId } from "./economy.constants";

export class EconomyRepository {
  async findUserById(
    id: string
  ): Promise<UserModelDocument | null> {
    return User.findById(id);
  }

  async updateUserBalance(
    userId: string,
    currencyId: CurrencyId,
    amount: number
  ): Promise<UserModelDocument | null> {
    return User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          [`economy.balances.${currencyId}`]: amount,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async findRewardTransaction(
    userId: string,
    type:
      | "quest_reward"
      | "achievement_reward",
    source: string,
    sourceId: string,
    currencyId: CurrencyId
  ): Promise<EconomyTransactionDocument | null> {
    return EconomyTransaction.findOne({
      userId,
      type,
      source,
      sourceId,
      currencyId,
    });
  }

  async findByUserId(
    userId: string,
    limit = 50
  ): Promise<EconomyTransactionDocument[]> {
    return EconomyTransaction.find({
      userId,
      currencyId: { $in: CURRENCY_IDS },
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const economyRepository = new EconomyRepository();
