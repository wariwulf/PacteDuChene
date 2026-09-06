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

  async findUsersForEconomyAdmin(): Promise<UserModelDocument[]> {
    return User.find({
      status: { $ne: "DELETED" },
    })
      .select("profile.username profile.displayName profile.avatar discord.username economy.balances")
      .sort({ "profile.username": 1 });
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
        returnDocument: "after",
        runValidators: true,
      }
    );
  }

  async findRewardTransaction(
    userId: string,
    type:
      | "quest_reward"
      | "achievement_reward"
      | "event_reward",
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
