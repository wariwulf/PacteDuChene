import { CurrencyModel } from "./currencies.model";
import {
  CURRENCY_IDS,
  CURRENCY_LABELS,
  type CurrencyId,
} from "./economy.constants";

export class CurrenciesRepository {
  /**
   * S'assure que toutes les monnaies officielles existent
   * dans la collection MongoDB.
   *
   * $setOnInsert est volontairement utilisé :
   * une monnaie déjà existante n'est jamais écrasée.
   */
  async ensureDefaultCurrencies() {
    await Promise.all(
      CURRENCY_IDS.map((currencyId) =>
        CurrencyModel.updateOne(
          { currencyId },
          {
            $setOnInsert: {
              currencyId,
              name: CURRENCY_LABELS[currencyId],
              description: `Monnaie officielle du Pacte du Chêne : ${CURRENCY_LABELS[currencyId]}.`,
              enabled: true,
            },
          },
          { upsert: true }
        )
      )
    );
  }

  async findAll() {
    return CurrencyModel.find({
      currencyId: { $in: CURRENCY_IDS },
    })
      .sort({ currencyId: 1 })
      .lean();
  }

  async findById(currencyId: CurrencyId) {
    return CurrencyModel.findOne({
      currencyId,
    }).lean();
  }

  async create(data: {
    currencyId: CurrencyId;
    name: string;
    description?: string;
    enabled?: boolean;
    icon?: string;
  }) {
    return CurrencyModel.create(data);
  }
}