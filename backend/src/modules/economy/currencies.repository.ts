import { CurrencyModel } from "./currencies.model";
import { CURRENCY_IDS, type CurrencyId } from "./economy.constants";

export class CurrenciesRepository {
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
