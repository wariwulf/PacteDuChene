import { PaxDeiRecipe } from "./paxdei.recipe.model";
import { PaxDeiRecipeData } from "./paxdei.catalog.types";

export class PaxDeiRecipeRepository {
  async upsertMany(rows: PaxDeiRecipeData[]) {
    if (!rows.length) return;
    await PaxDeiRecipe.bulkWrite(
      rows.map((row) => ({
        updateOne: {
          filter: { recipeId: row.recipeId },
          update: { $set: row },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async findByResultItemId(itemId: string) {
    return PaxDeiRecipe.find({ resultItemId: itemId })
      .sort({ name: 1 })
      .lean();
  }

  async count() {
    return PaxDeiRecipe.countDocuments();
  }
}

export const paxDeiRecipeRepository = new PaxDeiRecipeRepository();
