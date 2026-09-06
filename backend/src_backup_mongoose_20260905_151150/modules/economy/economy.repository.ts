import {
  User,
  UserModelDocument,
} from "../users/user.model";

import {
  EconomyTransaction,
  EconomyTransactionDocument,
} from "./economy-transaction.model";

export class EconomyRepository {
  async findUserById(
    id: string
  ): Promise<UserModelDocument | null> {
    return User.findById(id);
  }

  async findUsersByIds(
    ids: string[]
  ): Promise<UserModelDocument[]> {
    return User.find({
      _id: { $in: ids },
      status: { $ne: "DELETED" },
    });
  }

  async updateUserBalance(
    userId: string,
    currencyId: string,
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
    currencyId: string
  ): Promise<EconomyTransactionDocument | null> {
    return EconomyTransaction.findOne({
      userId,
      type,
      source,
      sourceId,
      currencyId,
    });
  }
}

export const economyRepository =
  new EconomyRepository();
