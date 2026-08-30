import { EconomyExchangeSettings } from "./economy-exchange.model";

export class EconomyExchangeRepository {
  async get() {
    return EconomyExchangeSettings.findOne({ key: "global" }).lean();
  }

  async ensureDefaults() {
    return EconomyExchangeSettings.findOneAndUpdate(
      { key: "global" },
      {
        $setOnInsert: {
          key: "global",
          argentPerSolidus: 100,
          bronzePerArgent: 100,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean();
  }

  async update(data: {
    argentPerSolidus: number;
    bronzePerArgent: number;
  }) {
    return EconomyExchangeSettings.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          argentPerSolidus: data.argentPerSolidus,
          bronzePerArgent: data.bronzePerArgent,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).lean();
  }
}

export const economyExchangeRepository =
  new EconomyExchangeRepository();
