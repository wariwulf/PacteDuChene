import mongoose from "mongoose";
import { economyRepository } from "./economy.repository";
import { economyTransactionRepository } from "./economy-transaction.repository";
import { economyExchangeRepository } from "./economy-exchange.repository";
import { isCurrencyId } from "./economy.constants";

type Operation = "add" | "remove";

function readBalance(
  balances: unknown,
  currencyId: string
): number {
  if (balances instanceof Map) {
    return Number(balances.get(currencyId) ?? 0);
  }

  if (
    balances &&
    typeof balances === "object" &&
    currencyId in balances
  ) {
    return Number(
      (balances as Record<string, unknown>)[currencyId] ?? 0
    );
  }

  return 0;
}

export class EconomyAdminService {
  async getExchangeRates() {
    const settings =
      await economyExchangeRepository.ensureDefaults();

    const argentPerSolidus =
      settings?.argentPerSolidus ?? 100;
    const bronzePerArgent =
      settings?.bronzePerArgent ?? 100;

    return {
      argentPerSolidus,
      bronzePerArgent,
      bronzePerSolidus:
        argentPerSolidus * bronzePerArgent,
    };
  }

  async updateExchangeRates(data: {
    argentPerSolidus: number;
    bronzePerArgent: number;
  }) {
    if (
      !Number.isFinite(data.argentPerSolidus) ||
      data.argentPerSolidus <= 0
    ) {
      throw new Error(
        "La valeur Argent par Solidus doit être supérieure à 0."
      );
    }

    if (
      !Number.isFinite(data.bronzePerArgent) ||
      data.bronzePerArgent <= 0
    ) {
      throw new Error(
        "La valeur Bronze par Argent doit être supérieure à 0."
      );
    }

    const settings =
      await economyExchangeRepository.update(data);

    const argentPerSolidus =
      settings?.argentPerSolidus ??
      data.argentPerSolidus;
    const bronzePerArgent =
      settings?.bronzePerArgent ??
      data.bronzePerArgent;

    return {
      argentPerSolidus,
      bronzePerArgent,
      bronzePerSolidus:
        argentPerSolidus * bronzePerArgent,
    };
  }

  async adjustMembers(data: {
    userIds: string[];
    currencyId: string;
    amount: number;
    operation: Operation;
    reason: string;
    actorId: string;
  }) {
    const userIds = [
      ...new Set(
        data.userIds
          .map((id) => String(id).trim())
          .filter(Boolean)
      ),
    ];

    if (userIds.length === 0) {
      throw new Error("Aucun membre sélectionné.");
    }

    if (!isCurrencyId(data.currencyId)) {
      throw new Error(
        "Monnaie invalide. Utilisez uniquement Solidus, Argent ou Bronze."
      );
    }

    if (
      !Number.isFinite(data.amount) ||
      data.amount <= 0
    ) {
      throw new Error("Le montant doit être supérieur à 0.");
    }

    const reason = String(data.reason ?? "").trim();

    if (reason.length < 3) {
      throw new Error(
        "Une justification d'au moins 3 caractères est obligatoire."
      );
    }

    if (reason.length > 500) {
      throw new Error(
        "La justification ne peut pas dépasser 500 caractères."
      );
    }

    const invalidId = userIds.find(
      (id) => !mongoose.isValidObjectId(id)
    );

    if (invalidId) {
      throw new Error(
        "Un identifiant de membre est invalide."
      );
    }

    const users =
      await economyRepository.findUsersByIds(userIds);

    const foundIds = new Set(
      users.map((user) => user._id.toString())
    );

    const missingIds = userIds.filter(
      (id) => !foundIds.has(id)
    );

    if (missingIds.length > 0) {
      throw new Error(
        `Un ou plusieurs membres sont introuvables (${missingIds.length}).`
      );
    }

    if (data.operation === "remove") {
      const insufficient = users.filter((user) => {
        const balance = readBalance(
          user.economy?.balances,
          data.currencyId
        );

        return balance < data.amount;
      });

      if (insufficient.length > 0) {
        throw new Error(
          `${insufficient.length} membre(s) n'ont pas assez de monnaie pour effectuer le retrait.`
        );
      }
    }

    const delta =
      data.operation === "add"
        ? data.amount
        : -data.amount;

    const results = [];

    for (const user of users) {
      const userId = user._id.toString();

      const updated =
        await economyRepository.updateUserBalance(
          userId,
          data.currencyId,
          delta
        );

      if (!updated) {
        throw new Error(
          `Impossible de modifier le solde du membre ${userId}.`
        );
      }

      await economyTransactionRepository.create({
        userId,
        currencyId: data.currencyId,
        amount: delta,
        type:
          data.operation === "add"
            ? "admin_add"
            : "admin_remove",
        source: "admin",
        sourceId:
          `${data.actorId}:${Date.now()}:${userId}`,
        description: reason,
      });

      results.push({
        userId,
        balances:
          updated.economy?.balances ?? {},
      });
    }

    return {
      operation: data.operation,
      currencyId: data.currencyId,
      amount: data.amount,
      reason,
      affectedCount: results.length,
      results,
    };
  }
}

export const economyAdminService =
  new EconomyAdminService();
