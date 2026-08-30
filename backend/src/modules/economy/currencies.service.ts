import { CurrenciesRepository } from "./currencies.repository";
import {
  CURRENCY_IDS,
  CURRENCY_LABELS,
  isCurrencyId,
  type CurrencyId,
} from "./economy.constants";

export class CurrenciesService {
  constructor(
    private readonly currenciesRepository = new CurrenciesRepository()
  ) {}

async getAllCurrencies() {
  await this.currenciesRepository.ensureDefaultCurrencies();

  return this.currenciesRepository.findAll();
}

    async getCurrency(currencyId: string) {
    if (!isCurrencyId(currencyId)) {
        throw new Error("Monnaie introuvable.");
    }

    await this.currenciesRepository.ensureDefaultCurrencies();

    const currency =
        await this.currenciesRepository.findById(currencyId);

    if (!currency) {
        throw new Error("Monnaie introuvable.");
    }

    return currency;
    }

  async createCurrency(data: {
    currencyId: string;
    name: string;
    description?: string;
    enabled?: boolean;
    icon?: string;
  }) {
    const currencyId = data.currencyId.trim().toLowerCase();

    if (!currencyId) {
      throw new Error("L'identifiant de la monnaie est obligatoire.");
    }

    if (!isCurrencyId(currencyId)) {
      throw new Error(
        `Monnaie invalide. Les seules monnaies disponibles sont : ${CURRENCY_IDS.join(", ")}.`
      );
    }

    const existingCurrency =
      await this.currenciesRepository.findById(currencyId);

    if (existingCurrency) {
      throw new Error("Cette monnaie existe déjà.");
    }

    const name = data.name.trim();

    if (!name) {
      throw new Error("Le nom de la monnaie est obligatoire.");
    }

    return this.currenciesRepository.create({
      ...data,
      currencyId,
      name,
      enabled: data.enabled ?? true,
    });
  }

  getCurrencyDefinitions(): Array<{
    currencyId: CurrencyId;
    name: string;
  }> {
    return CURRENCY_IDS.map((currencyId) => ({
      currencyId,
      name: CURRENCY_LABELS[currencyId],
    }));
  }
}

export const currenciesService = new CurrenciesService();
